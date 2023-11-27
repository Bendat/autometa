import { describe, it, beforeEach } from "vitest";
import { Site, WebSitePages, Website } from "../../src";
import { HomePage, SignInPage } from "../shop";
import { SignupPage } from "../shop/signup.page";
import { chromium, devices } from "playwright";
const MainSite = Site({
  home: HomePage,
  signup: SignupPage,
  signin: SignInPage
});
describe("E2E shopping test", () => {
  let site: Website<typeof MainSite>;

  beforeEach(async () => {
    const browser = await chromium.launch({
      headless: false,
      timeout: 50_000,
      slowMo: 1000
    });
    const context = await browser.newContext(devices["iPhone 11"]);
    const page = await context.newPage();
    page.setViewportSize({ width: 1280, height: 800 });
    site = MainSite.on(page, "https://magento.softwaretestingboard.com/");
  });

  it('should log in and purchase the highlighted promotion', ()=>{
    
  })
});
