import { describe, it } from "vitest";
import { Locator, chromium, devices } from "playwright";
import { expect } from "@playwright/test";
import { Website } from "../../src";
import { Shop } from "../shop/main.site";
describe("shop", () => {
  it("should load the shop", async () => {
    const site = await Website.open(Shop)
      .on(chromium)
      .with(devices["Desktop Chrome"])
      .at("https://magento.softwaretestingboard.com/")
      .launch({
        headless: false,
        timeout: 15_000,
      });
    const { home, goto, signin } = site;
    await goto("home");
    await home.goToSignIn();
    await signin.signInAs("bob.daily@faily.com", "password123;A");
    const mens = await home.menu.hover('Men');
    (mens as {locator: Locator}).locator.waitFor();
    // const tops = await home.menu.hover('Tops', mens);
    // await home.menu.select('Jackets', tops);
    // await home.menu.hover("Men");
    // await home.menu.hover("Tops");
    // await home.menu.select("Jackets");
    // await expect(home.page).toHaveTitle("Jackets - Tops - Men");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await site.close();
  }, 50_000);
});
