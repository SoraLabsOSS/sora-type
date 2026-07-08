import path from "node:path";
import { expect, test } from "@playwright/test";

const VARIABLE_FONT = path.join(
  process.cwd(),
  "e2e/fixtures/variable-test.ttf"
);

const FVAR_TAG_PATTERN = /^fvar/;
const CSS_FILENAME_PATTERN = /\.css$/;
const USED_COUNT_PATTERN = /^\d+ of/;

async function readClipboard(page: import("@playwright/test").Page) {
  return await page.evaluate(() => navigator.clipboard.readText());
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Helvetica Neue Medium" })
  ).toBeVisible({ timeout: 15_000 });

  await page.locator('input[type="file"]').setInputFiles(VARIABLE_FONT);
  await expect(
    page.getByRole("heading", { name: "Avenir Next LT Pro Regular" })
  ).toBeVisible({ timeout: 15_000 });
});

test("Raw tables: sections list and a collapsible section expands", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Raw tables", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Raw tables" })).toBeVisible();

  const fvarTrigger = page.getByText(FVAR_TAG_PATTERN).first();
  await expect(fvarTrigger).toBeVisible();
  await fvarTrigger.click();
  await expect(page.getByText("Field").first()).toBeVisible();
});

test("Tester: text alignment, optical sizing, and instance previews", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Tester" }).click();
  await expect(page.getByRole("heading", { name: "Tester" })).toBeVisible();

  await page.getByRole("button", { name: "Center" }).click();
  const textarea = page.locator("textarea").first();
  await expect(textarea).toHaveCSS("text-align", "center");

  // Selecting a named instance should update the axis sliders and CSS output.
  await page.getByRole("combobox", { name: "Instance", exact: true }).click();
  await page.getByRole("option").first().click();
  const generatedCss = page.locator("pre").first();
  await expect(generatedCss).toContainText("wght");

  const previewsToggle = page.getByLabel("Show instance previews");
  await previewsToggle.click();
  await expect(page.getByText("Regular").first()).toBeVisible();
});

test("Layout features: toggle a feature on and copy its CSS", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Layout Features" }).click();
  await expect(
    page.getByRole("heading", { name: "Optional layout features" })
  ).toBeVisible();

  const ligaGroup = page.getByRole("group", { name: "liga state" });
  await ligaGroup.getByRole("button", { name: "On" }).click();

  const css = page.getByText('"liga" 1');
  await expect(css).toBeVisible();

  await page.getByRole("button", { name: "Copy liga CSS" }).click();
  await expect(readClipboard(page)).resolves.toContain("liga");
});

test("CSS: switches update the generated stylesheet, copy and download work", async ({
  page,
}) => {
  await page.getByRole("button", { name: "CSS", exact: true }).click();
  await expect(page.getByRole("heading", { name: "CSS" })).toBeVisible();

  const stylesheet = page.locator("pre").first();
  await expect(stylesheet).not.toContainText("unicode-range");

  await page.getByLabel("Include unicode-range").click();
  await expect(stylesheet).toContainText("unicode-range");

  await page.getByRole("button", { name: "Copy stylesheet" }).click();
  await expect(readClipboard(page)).resolves.toContain("@font-face");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download stylesheet" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(CSS_FILENAME_PATTERN);
});

test("Subsetting: pasting text updates usage stats and subset command", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Subsetting" }).click();
  await expect(page.getByRole("heading", { name: "Subsetting" })).toBeVisible();

  await expect(page.getByText("0 of")).toBeVisible();

  await page.locator("textarea").fill("Hello world");
  await expect(page.getByText(USED_COUNT_PATTERN).first()).not.toContainText(
    "0 of"
  );

  await expect(
    page.getByRole("heading", { name: "Subset command" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy subset command" }).click();
  await expect(readClipboard(page)).resolves.toContain("pyftsubset");
});
