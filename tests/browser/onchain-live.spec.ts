import { expect, test, type Page } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import {
  address,
  generateKeyPairSigner,
  getAddressEncoder,
  getTransactionDecoder,
  getTransactionEncoder,
  partiallySignTransaction,
  signature,
} from "@solana/kit";
import type {
  Wallet,
  WalletAccount,
  WindowAppReadyEvent,
} from "@wallet-standard/base";
import { LocalnetClient } from "../../lib/solana/client";

// Test-only Wallet Standard provider, backed by a real ephemeral Ed25519 key.
// It is never included in the application, and never auto-signs as a fixture role.
async function installTestWallet(
  page: Page,
  chains = ["solana:localnet"],
  reject = false,
) {
  const signer = await generateKeyPairSigner();
  await page.exposeFunction("localTestSign", async (bytes: number[]) => {
    if (reject)
      throw new Error("User rejected the transaction in the test wallet.");
    const transaction = getTransactionDecoder().decode(Uint8Array.from(bytes));
    return Array.from(
      getTransactionEncoder().encode(
        await partiallySignTransaction([signer.keyPair], transaction),
      ),
    );
  });
  await page.addInitScript(
    ({ publicAddress, publicKey, chains }) => {
      const listeners = new Set<
        (changes: { accounts: WalletAccount[] }) => void
      >();
      const account: WalletAccount = {
        address: publicAddress,
        publicKey: Uint8Array.from(publicKey),
        chains: chains as WalletAccount["chains"],
        features: ["solana:signTransaction"],
      };
      let connected = false;
      const wallet: Wallet = {
        version: "1.0.0",
        name: "Disposable local test signer",
        icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=",
        chains: chains as Wallet["chains"],
        get accounts() {
          return connected ? [account] : [];
        },
        features: {
          "standard:connect": {
            version: "1.0.0",
            connect: async () => {
              connected = true;
              listeners.forEach((listener) =>
                listener({ accounts: [account] }),
              );
              return { accounts: [account] };
            },
          },
          "standard:disconnect": {
            version: "1.0.0",
            disconnect: async () => {
              connected = false;
              listeners.forEach((listener) => listener({ accounts: [] }));
            },
          },
          "standard:events": {
            version: "1.0.0",
            on: (
              _event: string,
              listener: (changes: { accounts: WalletAccount[] }) => void,
            ) => {
              listeners.add(listener);
              return () => listeners.delete(listener);
            },
          },
          "solana:signTransaction": {
            version: "1.0.0",
            supportedTransactionVersions: ["legacy"],
            signTransaction: async (input: { transaction: Uint8Array }) => {
              const sign = (
                window as unknown as {
                  localTestSign: (bytes: number[]) => Promise<number[]>;
                }
              ).localTestSign;
              return [
                {
                  signedTransaction: Uint8Array.from(
                    await sign(Array.from(input.transaction)),
                  ),
                },
              ];
            },
          },
        },
      };
      window.addEventListener("wallet-standard:app-ready", (event: Event) => {
        (event as WindowAppReadyEvent).detail.register(wallet);
      });
    },
    {
      publicAddress: signer.address,
      publicKey: Array.from(getAddressEncoder().encode(signer.address)),
      chains,
    },
  );
  return signer;
}
const receipt = () =>
  JSON.parse(readFileSync("anchor/localnet/receipt.json", "utf8")) as {
    browserCampaign: string;
    venueToken: string;
    instructorToken: string;
  };

test("wallet rejection leaves escrow unchanged and shows no activation signature", async ({
  page,
}) => {
  await installTestWallet(page, ["solana:localnet"], true);
  const fixture = receipt();
  await page.goto("/onchain-demo");
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(fixture.browserCampaign);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page.getByRole("button", { name: "Activate with my wallet" }).click();
  await page.getByRole("button", { name: "Sign real activation" }).click();
  await expect(page.getByRole("status")).toContainText("User rejected");
  await expect(page.getByTestId("chain-transaction-signature")).toHaveCount(0);
  await expect(page.getByTestId("chain-vault-balance")).toHaveText(
    "200 local test tokens",
  );
  expect(
    (await new LocalnetClient().snapshot()).campaigns.find(
      (item) => item.address === fixture.browserCampaign,
    )!.status,
  ).toBe("Open");
});

test("authentic wallet signs activation, real balances settle, and refresh reads chain", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const signer = await installTestWallet(page);
  const client = new LocalnetClient();
  const fixture = receipt();
  const before = await client.snapshot();
  const campaign = before.campaigns.find(
    (item) => item.address === fixture.browserCampaign,
  )!;
  expect(campaign.status).toBe("Open");
  expect(campaign.balance).toBe(200_000_000n);
  const venueBefore = BigInt(
    (
      await client.rpc
        .getTokenAccountBalance(address(fixture.venueToken))
        .send()
    ).value.amount,
  );
  const instructorBefore = BigInt(
    (
      await client.rpc
        .getTokenAccountBalance(address(fixture.instructorToken))
        .send()
    ).value.amount,
  );
  await page.goto("/onchain-demo");
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(fixture.browserCampaign);
  await expect(page.getByTestId("chain-vault-balance")).toHaveText(
    "200 local test tokens",
  );
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByTestId("chain-wallet-address")).toHaveText(
    signer.address,
  );
  await page.getByRole("button", { name: "Request local test SOL" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Confirmed — local test SOL received.",
  );
  await page.getByRole("button", { name: "Activate with my wallet" }).click();
  await expect(page.getByRole("dialog")).toContainText("80");
  await page.getByRole("button", { name: "Sign real activation" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Confirmed — activation executed on the local validator.",
  );
  const txSignature = (await page
    .getByTestId("chain-transaction-signature")
    .textContent())!;
  await client.confirm(signature(txSignature));
  const settled = (await client.snapshot()).campaigns.find(
    (item) => item.address === campaign.address,
  )!;
  expect(settled.status).toBe("Activated");
  expect(settled.balance).toBe(0n);
  expect(settled.escrowed_amount).toBe(0n);
  expect(
    BigInt(
      (
        await client.rpc
          .getTokenAccountBalance(address(fixture.venueToken))
          .send()
      ).value.amount,
    ) - venueBefore,
  ).toBe(80_000_000n);
  expect(
    BigInt(
      (
        await client.rpc
          .getTokenAccountBalance(address(fixture.instructorToken))
          .send()
      ).value.amount,
    ) - instructorBefore,
  ).toBe(120_000_000n);
  console.log(
    `REAL BROWSER ACTIVATION: ${txSignature}; campaign=${campaign.address}; payouts=80000000/120000000; vault=0`,
  );
  writeFileSync(
    "anchor/localnet/browser-receipt.json",
    JSON.stringify(
      {
        programId: client.config.programId,
        campaign: campaign.address,
        signer: signer.address,
        signature: txSignature,
        venueDelta: "80000000",
        instructorDelta: "120000000",
        vault: "0",
      },
      null,
      2,
    ),
  );
  await page.reload();
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(fixture.browserCampaign);
  await expect(page.getByTestId("chain-status")).toHaveText("Activated");
  await expect(page.getByTestId("chain-vault-balance")).toHaveText(
    "0 local test tokens",
  );
  await expect(
    page.getByRole("button", { name: "Activate with my wallet" }),
  ).toBeDisabled();
  await expect(page.getByText(txSignature, { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/onchain-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});

test("wallet network mismatch blocks local signing and faucet", async ({
  page,
}) => {
  await installTestWallet(page, ["solana:devnet"]);
  await page.goto("/onchain-demo");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.locator(".chain-error[role='alert']")).toContainText(
    "Wallet network mismatch",
  );
  await expect(
    page.getByRole("button", { name: "Activate with my wallet" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Request local test SOL" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Disconnect wallet" }).click();
  await expect(page.getByTestId("chain-wallet-address")).toHaveCount(0);
});
