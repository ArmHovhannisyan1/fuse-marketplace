import { expect, test } from "@playwright/test";

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
  }
});
