import path from "node:path";
import { expect, test } from "@playwright/test";

const LEFT_FONT = path.join(process.cwd(), "e2e/fixtures/variable-test.ttf");
const RIGHT_FONT = path.join(process.cwd(), "e2e/fixtures/variable-test-2.ttf");

test.beforeEach(async ({ page }) => {
  await page.goto("/compare");
});

async function uploadFonts(page: import("@playwright/test").Page) {
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(LEFT_FONT);
  await fileInputs.nth(1).setInputFiles(RIGHT_FONT);
}

test("shows independent variable-axis sliders per font on the Text tab", async ({
  page,
}) => {
  await uploadFonts(page);

  // Left font (AvenirNext Variable) has wght + wdth axes.
  await expect(page.getByText("Weight (wght)").first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("Width (wdth)").first()).toBeVisible();
  // Right font (Kairos Sans Variable) additionally has an Italic axis.
  await expect(page.getByText("Italic (ital)")).toBeVisible();

  const preview = page.getByText(
    "Traditionally, text is composed to create a readable"
  );
  const before = await preview
    .first()
    .evaluate((el) => getComputedStyle(el).fontVariationSettings);

  const weightInput = page
    .getByRole("spinbutton", { name: "Weight", exact: true })
    .first();
  await weightInput.fill("900");
  await weightInput.press("Tab");

  const after = await preview
    .first()
    .evaluate((el) => getComputedStyle(el).fontVariationSettings);
  expect(after).not.toBe(before);
  expect(after).toContain("900");
});

test("Overlay tab draws metric guide lines and can toggle them off", async ({
  page,
}) => {
  await uploadFonts(page);

  await page
    .getByRole("navigation", { name: "Tabs" })
    .getByRole("button", { name: "Overlay" })
    .click();

  const guideToggle = page.getByLabel("Show metric guides");
  await expect(guideToggle).toBeVisible({ timeout: 15_000 });
  await expect(guideToggle).toBeChecked();

  const lines = page.locator("svg line");
  await expect(lines.first()).toHaveAttribute("class", "stroke-border");
  const countWithGuides = await lines.count();
  expect(countWithGuides).toBeGreaterThan(0);

  await guideToggle.click();
  await expect(lines).toHaveCount(0);
});
