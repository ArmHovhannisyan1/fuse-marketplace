import { expect, test } from "@playwright/test";

test("SUCCESS: two seats, supplier approval, one exact payout, and persistence", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/marketplace/clay-and-company");
  await expect(page.getByLabel("Act as")).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Activate booking", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Seats to commit").fill("2");
  await page.getByRole("button", { name: "Review commitment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "No cancellation before activation or expiry",
  );
  await page.getByRole("button", { name: "Confirm 40 demo tokens" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "10",
  );
  await expect(
    page.getByRole("button", { name: "Activate booking", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#activation-reason")).toContainText(
    "Waiting for instructor approval.",
  );
  await page.getByLabel("Act as").selectOption("instructor");
  await page.getByRole("button", { name: "Approve as instructor" }).click();
  await expect(
    page.getByRole("button", { name: "Activate booking", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Activate booking", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm activation" }).click();
  await expect(
    page.getByRole("button", { name: "Booking activated", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".payout-receipt")).toContainText(
    "Venue: 80 · Instructor: 120 demo tokens",
  );
  await page.reload();
  await expect(page.locator(".payout-receipt")).toBeVisible();
  await page.getByLabel("Act as").selectOption("sam");
  await expect(
    page.getByRole("button", { name: "Claim refund", exact: true }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test("EXPIRY: own refund, no second claim, persistent clock, and full reset", async ({
  page,
}) => {
  await page.goto("/marketplace/clay-and-company");
  await expect(page.getByLabel("Act as")).toBeEnabled();
  await page.getByRole("button", { name: "Advance past deadline" }).click();
  await page
    .getByRole("button", { name: "Advance clock", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Activate booking", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Claim 40 demo token refund" })
    .click();
  await expect(
    page.getByRole("button", { name: "Refund already claimed" }),
  ).toBeDisabled();
  await expect(page.locator(".action-message[role='status']")).toContainText(
    "returned to your demo balance",
  );
  const clock = await page.locator(".clock-display strong").textContent();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Refund already claimed" }),
  ).toBeDisabled();
  await expect(page.locator(".clock-display strong")).toHaveText(clock!);
  await page.getByRole("button", { name: "Reset entire demo" }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "8",
  );
  await expect(
    page.getByRole("button", { name: "Review commitment" }),
  ).toBeEnabled();
});

test("publishing validates, reviews, and persists fixed terms across direct refresh", async ({
  page,
}) => {
  await page.goto("/create");
  await page.getByLabel("Act as").selectOption("organizer");
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(page.getByLabel("Workshop title")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByLabel("Workshop title").fill("A Sunday in clay");
  await page
    .getByLabel("Description", { exact: true })
    .fill("An introductory pottery session with a small group.");
  await page
    .getByLabel("Location", { exact: true })
    .fill("Yerevan · Makers Studio");
  await page.getByLabel("Venue name").fill("Makers Studio");
  await page.getByLabel("Instructor name").fill("Demo clay instructor");
  await page.getByLabel("Instructor allocation").fill("121");
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(
    page.getByText(
      "Both allocations must add up exactly to the funding target.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByLabel("Instructor allocation").fill("120");
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "These terms become fixed at publication.",
  );
  await page.getByRole("button", { name: "Publish demo booking" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A Sunday in clay",
  );
  const deadline = await page.locator(".deadline-row strong").textContent();
  const url = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "A Sunday in clay",
  );
  await expect(page.locator(".deadline-row strong")).toHaveText(deadline!);
  await page.goto("/marketplace");
  await page.getByLabel("Search workshops by title").fill("Sunday");
  await expect(page.locator(".deal-card")).toHaveCount(1);
  await page
    .getByRole("link", { name: "A Sunday in clay", exact: true })
    .click();
  await expect(page).toHaveURL(url);
});

test("invalid storage recovers gracefully and dialogs support keyboard dismissal", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("fuse-demo-v1", '{"version":99}'),
  );
  await page.goto("/marketplace/clay-and-company");
  await expect(page.locator(".storage-notice")).toContainText(
    "A fresh demo has been restored",
  );
  await page.getByRole("button", { name: "Review commitment" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Go back", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement?.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Review commitment" }),
  ).toBeFocused();
});

test("storage unavailable keeps the interactive demo working for this session", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.goto("/marketplace/clay-and-company");
  await expect(page.locator(".storage-notice")).toContainText(
    "Changes will last for this session only",
  );
  await page.getByRole("button", { name: "Review commitment" }).click();
  await page.getByRole("button", { name: "Confirm 20 demo tokens" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "9",
  );
});

for (const width of [375, 768, 1440]) {
  test(`routes and responsive layouts at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    for (const route of [
      "/",
      "/marketplace",
      "/marketplace/clay-and-company",
      "/how-it-works",
      "/about",
      "/create",
      "/my-commitments",
    ]) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".prototype-strip")).toContainText(
        "simulated funds. No real transactions.",
      );
      await page.screenshot({
        path: testInfo.outputPath(
          `${route.replaceAll("/", "-") || "home"}-${width}.png`,
        ),
        fullPage: true,
        caret: "initial",
      });
      if (route === "/" || route === "/marketplace/clay-and-company") {
        await page.screenshot({
          path: testInfo.outputPath(
            `viewport-${route === "/" ? "home" : "deal"}-${width}.png`,
          ),
          caret: "initial",
        });
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const emptyLinks = await page.locator('a[href=""],a[href="#"]').count();
      expect(emptyLinks).toBe(0);
    }
    if (width === 375) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page.getByRole("navigation", { name: "Mobile navigation" }),
      ).toBeVisible();
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: "About", exact: true })
        .click();
      await expect(page).toHaveURL(/\/about$/);
      await expect(
        page.getByRole("navigation", { name: "Mobile navigation" }),
      ).toHaveCount(0);
    }
    await page.goto("/marketplace");
    await page.getByLabel("Search workshops by title").fill("does not exist");
    await expect(
      page.getByRole("heading", { name: "No workshops found." }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Clear search and filters" })
      .click();
    await expect(page.locator(".deal-card")).toHaveCount(5);
    expect(errors).toEqual([]);
  });
}
