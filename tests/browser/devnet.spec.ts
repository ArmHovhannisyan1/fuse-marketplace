import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { installTestWallet } from "./helpers/wallet";

const proof = JSON.parse(readFileSync("docs/devnet-proof.json", "utf8"));

test("unavailable Devnet RPC never substitutes simulation funds or requests a public airdrop", async ({
  page,
}) => {
  await page.route("https://api.devnet.solana.com/**", (route) =>
    route.abort(),
  );
  await page.goto("/onchain-demo?network=devnet");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Solana Devnet",
  );
  await expect(page.locator(".chain-error[role='alert']")).toContainText(
    "Devnet RPC unavailable",
  );
  await expect(page.getByTestId("chain-vault-balance")).toHaveCount(0);
  const evidence = page.getByRole("region", {
    name: "Verified Devnet evidence · historical",
  });
  await expect(evidence).toContainText("not a new run or current balances");
  await expect(evidence).toContainText("venue 80, instructor 120 test tokens");
  await expect(evidence).toContainText("40 test tokens returned");
  for (const label of [
    "A: Deposit eight seats",
    "A: Full funding alone cannot activate",
    "A: Authentic venue approval",
    "A: Authentic instructor approval",
    "A: Activate and pay suppliers",
    "B: Contributor claims own refund",
  ]) {
    const record = proof.transactions.find(
      (entry: { label: string }) => entry.label === label,
    );
    await expect(
      evidence.getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute(
      "href",
      `https://explorer.solana.com/tx/${record.signature}?cluster=devnet`,
    );
    if (record.error) {
      await expect(
        evidence.getByRole("listitem").filter({ hasText: label }),
      ).toContainText("Failed on-chain as expected");
    }
  }
  await expect(
    page.getByRole("button", { name: "Request local test SOL" }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.locator(".chain-error").last()).toContainText(
    "No compatible wallet found",
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/devnet-evidence-${width}.png`,
      fullPage: true,
    });
  }
});

test("Devnet rate limits stop after bounded retries and keep historical proof available", async ({
  page,
}) => {
  let requests = 0;
  await page.route("https://api.devnet.solana.com/**", (route) => {
    requests++;
    return route.fulfill({
      status: 429,
      headers: { "retry-after": "1" },
      body: "Rate limited",
    });
  });
  await page.goto("/onchain-demo?network=devnet");
  await expect(page.locator(".chain-error[role='alert']")).toContainText(
    "The free Devnet RPC is busy",
    { timeout: 20_000 },
  );
  expect(requests).toBe(3);
  await expect(page.getByTestId("chain-vault-balance")).toHaveCount(0);
  await expect(
    page.getByRole("link", {
      name: "A: Activate and pay suppliers",
      exact: true,
    }),
  ).toHaveAttribute(
    "href",
    `https://explorer.solana.com/tx/${proof.success.activationSignature}?cluster=devnet`,
  );
  await page.getByRole("button", { name: "Refresh on-chain state" }).click();
  await expect(
    page.getByRole("button", { name: "Refresh on-chain state" }),
  ).toBeEnabled({ timeout: 20_000 });
  expect(requests).toBe(6);
});

test("wallet disconnection clears the authorized account and blocks activation", async ({
  page,
}) => {
  await page.route("https://api.devnet.solana.com/**", (route) =>
    route.abort(),
  );
  await installTestWallet(page, ["solana:devnet"]);
  await page.goto("/onchain-demo?network=devnet");
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByTestId("chain-wallet-address")).toBeVisible();
  await page.evaluate(() =>
    window.dispatchEvent(new Event("fuse-test-wallet-disconnect")),
  );
  await expect(page.getByTestId("chain-wallet-address")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Activate with my wallet" }),
  ).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.getByTestId("chain-wallet-address")).toBeVisible();
  await page
    .getByRole("button", { name: "Disconnect wallet", exact: true })
    .click();
  await expect(page.getByTestId("chain-wallet-address")).toHaveCount(0);
});
