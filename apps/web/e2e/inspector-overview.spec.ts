import path from "node:path";
import { expect, test } from "@playwright/test";

const VARIABLE_FONT = path.join(
  process.cwd(),
  "e2e/fixtures/variable-test.ttf"
);
const GLYPHS_LABEL_PATTERN = /glyphs$/;
const PDF_FILENAME_PATTERN = /-report\.pdf$/;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Wait for the bundled placeholder font to finish its own async load first
  // — uploading immediately can race it and get clobbered when the
  // placeholder's fetch resolves after the upload's.
  await expect(
    page.getByRole("heading", { name: "Helvetica Neue Medium" })
  ).toBeVisible({ timeout: 15_000 });

  await page.locator('input[type="file"]').setInputFiles(VARIABLE_FONT);
  await expect(
    page.getByRole("heading", { name: "Avenir Next LT Pro Regular" })
  ).toBeVisible({ timeout: 15_000 });
});

test("sidebar shows font summary and lets you switch views", async ({
  page,
}) => {
  await expect(page.getByText(GLYPHS_LABEL_PATTERN)).toBeVisible();
  await expect(page.getByText("TTF").first()).toBeVisible();

  await page.getByRole("button", { name: "Raw tables", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Raw tables" })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await expect(
    page.getByPlaceholder("Type something to preview…")
  ).toBeVisible();
});

test("live preview: font size slider and text input update the preview", async ({
  page,
}) => {
  const preview = page.getByPlaceholder("Type something to preview…");
  const before = await preview.evaluate((el) => getComputedStyle(el).fontSize);

  const sizeSlider = page.getByRole("slider", { name: "Font size" }).first();
  await sizeSlider.focus();
  await sizeSlider.press("End"); // jump to slider max

  const after = await preview.evaluate((el) => getComputedStyle(el).fontSize);
  expect(after).not.toBe(before);

  await preview.fill("Hamburgefonstiv");
  await expect(preview).toHaveValue("Hamburgefonstiv");
});

test("glyph grid: 'Group by category' toggles pressed state", async ({
  page,
}) => {
  const toggle = page.getByRole("button", { name: "Group by category" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

test("Color view is hidden in the sidebar for a non-color font", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Color" })).toHaveCount(0);
});

test("Export PDF report downloads a PDF for a real uploaded font", async ({
  page,
}) => {
  const exportButton = page.getByRole("button", {
    name: "Export PDF report",
  });
  await expect(exportButton).toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportButton.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(PDF_FILENAME_PATTERN);
});

test("Export PDF report is disabled while only the placeholder font is loaded", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Export PDF report" })
  ).toBeDisabled();
});
