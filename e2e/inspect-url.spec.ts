import path from "node:path";
import { expect, test } from "@playwright/test";

const VARIABLE_FONT = path.join(
  process.cwd(),
  "e2e/fixtures/variable-test.ttf"
);
const FAKE_FONT_URL = "https://example-test-fonts.local/variable-test.ttf";
const LOAD_ERROR_PATTERN = /Could not load font/i;
const FETCH_ERROR_PATTERN = /Could not load font from that URL/i;

test("loads a font automatically from ?inspectUrl=", async ({ page }) => {
  await page.route(FAKE_FONT_URL, (route) =>
    route.fulfill({ path: VARIABLE_FONT, contentType: "font/ttf" })
  );

  await page.goto(`/?inspectUrl=${encodeURIComponent(FAKE_FONT_URL)}`);

  await expect(page.getByText("Avenir Next LT Pro Regular")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(LOAD_ERROR_PATTERN)).toHaveCount(0);
});

test("shows a clear error when the URL can't be fetched", async ({ page }) => {
  const blockedUrl = "https://example-test-fonts.local/blocked.ttf";
  await page.route(blockedUrl, (route) => route.abort("failed"));

  await page.goto(`/?inspectUrl=${encodeURIComponent(blockedUrl)}`);

  await expect(page.getByText(FETCH_ERROR_PATTERN)).toBeVisible({
    timeout: 15_000,
  });
});

test("ignores unsafe URL schemes and falls back to the placeholder", async ({
  page,
}) => {
  await page.goto(`/?inspectUrl=${encodeURIComponent("javascript:alert(1)")}`);

  // Falls back to the bundled placeholder font instead of attempting the
  // unsafe scheme — no error, no crash.
  await expect(page.getByText(LOAD_ERROR_PATTERN)).toHaveCount(0);
});
