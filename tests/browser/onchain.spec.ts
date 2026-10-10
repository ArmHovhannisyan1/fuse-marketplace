import { expect, test } from "@playwright/test";

test("unavailable local RPC and missing wallet never show simulated funds", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:8899/**", (route) =>
    route.abort("connectionrefused"),
  );
  await page.goto("/onchain-demo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Solana Localnet",
  );
  await expect(page.locator(".chain-error[role='alert']")).toContainText(
    "Local RPC unavailable",
  );
  await expect(page.getByTestId("chain-vault-balance")).toHaveCount(0);
  await expect(
    page.getByText("No compatible wallet detected", { exact: true }),
  ).toBeAttached();
  await page
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await expect(page.locator(".chain-error[role='alert']").last()).toContainText(
    "No compatible wallet found",
  );
  await expect(
    page.getByText(
      "Interactive prototype — simulated funds. No real transactions.",
      { exact: true },
    ),
  ).toHaveCount(0);
});

test("localnet error page stays readable at mobile, tablet and desktop widths", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:8899/**", (route) => route.abort());
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/onchain-demo");
    await expect(page.locator(".chain-error[role='alert']")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
