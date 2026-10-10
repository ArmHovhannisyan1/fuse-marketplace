import { expect, test } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { address, signature } from "@solana/kit";
import { EscrowClient } from "../../lib/solana/client";
import { installTestWallet } from "./helpers/wallet";

const fixture = () =>
  JSON.parse(readFileSync("docs/devnet-proof.json", "utf8"));

test("Devnet reads genuine state and exposes real Explorer records after refresh", async ({
  page,
}) => {
  const proof = fixture();
  await page.goto("/onchain-demo?network=devnet");
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(proof.success.campaign);
  await expect(page.getByTestId("chain-status")).toHaveText("Activated");
  await expect(page.getByTestId("chain-vault-balance")).toHaveText(
    "0 valueless Devnet test tokens",
  );
  await expect(
    page.locator(`a[href*='${proof.success.activationSignature}']`),
  ).toHaveAttribute(
    "href",
    `https://explorer.solana.com/tx/${proof.success.activationSignature}?cluster=devnet`,
  );
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(proof.expiry.campaign);
  await expect(page.getByTestId("chain-status")).toHaveText("FullyRefunded");
  await page.reload();
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(proof.expiry.campaign);
  await expect(page.getByTestId("chain-vault-balance")).toHaveText(
    "0 valueless Devnet test tokens",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/devnet-${width}.png`,
      fullPage: true,
    });
  }
});

test("authentic browser wallet signs Devnet activation and exact payouts are confirmed", async ({
  page,
}) => {
  const proof = fixture();
  const signer = await installTestWallet(page, ["solana:devnet"]);
  // Test runner only: explicit operator CLI transfer to a new disposable signer.
  // The application contains no deployment key and never calls this command.
  const fundOutput = execFileSync(
    "wsl.exe",
    [
      "-d",
      "Ubuntu",
      "--",
      "bash",
      "/mnt/c/Users/User/Desktop/fuse-marketplace/anchor/scripts/devnet.sh",
      "fund-test",
      signer.address,
    ],
    { encoding: "utf8", timeout: 60_000 },
  );
  console.log(fundOutput.trim());
  const client = new EscrowClient();
  const tokenBalance = async (account: string) =>
    BigInt(
      (await client.rpc.getTokenAccountBalance(address(account)).send()).value
        .amount,
    );
  const venueBefore = await tokenBalance(proof.venueToken);
  const instructorBefore = await tokenBalance(proof.instructorToken);
  await page.goto("/onchain-demo?network=devnet");
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(proof.browserCampaign);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByTestId("chain-wallet-address")).toHaveText(
    signer.address,
  );
  await expect(
    page.getByRole("button", { name: "Activate with my wallet" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Activate with my wallet" }).click();
  await expect(page.getByRole("dialog")).toContainText("Network: Devnet");
  await page.getByRole("button", { name: "Sign real activation" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Confirmed — activation executed on Solana Devnet.",
    { timeout: 60_000 },
  );
  const tx = (await page
    .getByTestId("chain-transaction-signature")
    .textContent())!.trim();
  await client.confirm(signature(tx));
  const settled = (await client.snapshot()).campaigns.find(
    (campaign) => campaign.address === proof.browserCampaign,
  )!;
  expect(settled.status).toBe("Activated");
  expect(settled.balance).toBe(0n);
  expect((await tokenBalance(proof.venueToken)) - venueBefore).toBe(
    80_000_000n,
  );
  expect((await tokenBalance(proof.instructorToken)) - instructorBefore).toBe(
    120_000_000n,
  );
  writeFileSync(
    "docs/devnet-browser-proof.json",
    JSON.stringify(
      {
        rpc: client.config.rpcUrl,
        programId: client.config.programId,
        campaign: settled.address,
        mint: settled.mint,
        venueToken: proof.venueToken,
        instructorToken: proof.instructorToken,
        signer: signer.address,
        signature: tx,
        venueDeltaBaseUnits: "80000000",
        instructorDeltaBaseUnits: "120000000",
        vaultBaseUnits: "0",
        wallet:
          "test-only Wallet Standard provider with an authentic ephemeral Ed25519 signer",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`REAL DEVNET BROWSER ACTIVATION: ${tx}; payouts=80/120; vault=0`);
  await page.reload();
  await page
    .getByLabel("Campaign from the validator")
    .selectOption(proof.browserCampaign);
  await expect(page.getByTestId("chain-status")).toHaveText("Activated");
  await expect(
    page.getByRole("button", { name: "Activate with my wallet" }),
  ).toBeDisabled();
});

test("a wallet lacking Devnet support cannot sign or request public faucet funds", async ({
  page,
}) => {
  await installTestWallet(page, ["solana:localnet"]);
  await page.goto("/onchain-demo?network=devnet");
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
  ).toHaveCount(0);
});
