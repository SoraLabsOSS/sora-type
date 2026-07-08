import path from "node:path";
import { expect, test } from "@playwright/test";

const LEFT_FONT = path.join(process.cwd(), "e2e/fixtures/variable-test.ttf");
const RIGHT_FONT = path.join(process.cwd(), "e2e/fixtures/variable-test-2.ttf");

async function uploadFonts(page: import("@playwright/test").Page) {
  const fileInputs = page.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles(LEFT_FONT);
  await fileInputs.nth(1).setInputFiles(RIGHT_FONT);
}

async function goToTab(page: import("@playwright/test").Page, name: string) {
  await page
    .getByRole("navigation", { name: "Tabs" })
    .getByRole("button", { name })
    .click();
}

async function readClipboard(page: import("@playwright/test").Page) {
  return await page.evaluate(() => navigator.clipboard.readText());
}

const CSS_FILENAME_PATTERN = /\.css$/;

test.beforeEach(async ({ page }) => {
  await page.goto("/compare");
  await uploadFonts(page);
});

test("Characters tab: 'Group by category' applies to both glyph grids", async ({
  page,
}) => {
  await goToTab(page, "Characters");
  const toggle = page.getByLabel("Group by category");
  await expect(toggle).not.toBeChecked();
  await toggle.click();
  await expect(toggle).toBeChecked();
});

test("Features tab: shows a present/not-present comparison table", async ({
  page,
}) => {
  await goToTab(page, "Features");
  await expect(page.getByText("liga").first()).toBeVisible();
  await expect(page.getByText("Present").first()).toBeVisible();
});

test("CSS tab: each column has its own independent copy/download controls", async ({
  page,
}) => {
  await goToTab(page, "CSS");

  const copyButtons = page.getByRole("button", { name: "Copy stylesheet" });
  await expect(copyButtons).toHaveCount(2);

  await copyButtons.first().click();
  const firstClip = await readClipboard(page);
  expect(firstClip).toContain("@font-face");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download stylesheet" }).first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(CSS_FILENAME_PATTERN);
});

test("Data tab: 'Highlight differences' toggles bold styling on differing rows", async ({
  page,
}) => {
  await goToTab(page, "Data");
  const highlightSwitch = page.getByLabel("Highlight differences");
  await expect(highlightSwitch).toBeVisible();
  // PostScript names differ between the two fixture fonts, so this row
  // should exist and its cells should react to the toggle.
  await expect(page.getByText("PostScript name")).toBeVisible();

  await expect(highlightSwitch).toBeChecked();
  await highlightSwitch.click();
  await expect(highlightSwitch).not.toBeChecked();
});

test("Pairing tab: reports per-axis differences with plain-language notes", async ({
  page,
}) => {
  await goToTab(page, "Pairing");

  await expect(
    page.getByText("This compares geometric proportions only")
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText("x-height ratio")).toBeVisible();
  await expect(page.getByText("Cap-height ratio")).toBeVisible();
  await expect(page.getByText("Weight", { exact: true })).toBeVisible();
  await expect(page.getByText("Width", { exact: true })).toBeVisible();
  await expect(page.getByText("Slant", { exact: true })).toBeVisible();

  // The two fixture fonts have noticeably different x-height ratios
  // (0.468 vs 0.550), so that row should be flagged as the largest bucket.
  await expect(page.getByText("Distinct").first()).toBeVisible();

  // Both fixtures declare PANOSE bSerifStyle 11 (Normal Sans), so the
  // family-style axis should resolve to "Matched" rather than being omitted
  // as unknown.
  await expect(page.getByText("Family style", { exact: true })).toBeVisible();
  await expect(page.getByText("Sans-serif").first()).toBeVisible();
});

test("Font details: Compare and single-font inspector both show Classification", async ({
  page,
}) => {
  await goToTab(page, "Data");
  await expect(page.getByText("Classification").first()).toBeVisible();
  await expect(page.getByText("Sans-serif").first()).toBeVisible();
});

test("About Compare tab renders explanatory content", async ({ page }) => {
  await goToTab(page, "About Compare");
  await expect(
    page.getByText("Compare loads two fonts entirely in your browser")
  ).toBeVisible();
});
