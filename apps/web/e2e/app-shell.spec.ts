import { expect, test } from "@playwright/test";

const THEME_SWITCH_NAME_PATTERN = /Switch to (dark|light) mode/;
const COMPARE_URL_PATTERN = /\/compare$/;
const ROOT_URL_PATTERN = /\/$/;
const ABOUT_URL_PATTERN = /\/about$/;
const PRIVACY_URL_PATTERN = /\/privacy$/;

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

test("about page renders product overview and links to privacy", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", {
      name: "A font inspector that runs entirely in your browser",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Compare", exact: true })
  ).toBeVisible();
  await expect(page.getByText("pairing diagnostics")).toBeVisible();

  await page
    .getByRole("link", { name: "Read the full privacy policy" })
    .click();
  await expect(page).toHaveURL(PRIVACY_URL_PATTERN);
});

test("the About Sora Type sheet links to the about page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "About Sora Type" }).click();
  await page.getByRole("button", { name: "What's inside" }).click();
  await expect(page).toHaveURL(ABOUT_URL_PATTERN);
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
