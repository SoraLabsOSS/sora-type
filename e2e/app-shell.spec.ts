import { expect, test } from "@playwright/test";

const THEME_SWITCH_NAME_PATTERN = /Switch to (dark|light) mode/;
const COMPARE_URL_PATTERN = /\/compare$/;
const ROOT_URL_PATTERN = /\/$/;

test("theme switcher toggles between light and dark mode", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("switch", {
    name: THEME_SWITCH_NAME_PATTERN,
  });
  await expect(toggle).toBeVisible();

  const htmlBefore = await page
    .locator("html")
    .getAttribute("data-theme")
    .catch(() => null);

  await toggle.click();

  await expect(async () => {
    const htmlAfter = await page.locator("html").getAttribute("data-theme");
    expect(htmlAfter).not.toBe(htmlBefore);
  }).toPass({ timeout: 5000 });
});

test("privacy page renders static content", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("primary navigation links between Inspector and Compare", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Compare" }).click();
  await expect(page).toHaveURL(COMPARE_URL_PATTERN);
  await expect(page.getByRole("heading", { name: "Compare" })).toBeVisible();

  await page.getByRole("link", { name: "Inspector" }).click();
  await expect(page).toHaveURL(ROOT_URL_PATTERN);
});
