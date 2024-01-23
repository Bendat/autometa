import { describe, it, expect, vi } from "vitest";
import { WebPage } from "./component";
import { Root, Website } from "./site";
import { Page } from "playwright";

class TestHomePage extends WebPage {
  route = "boop";
}

const MainSite = Root(TestHomePage);

describe("Site", () => {
  it("should construct a site", async () => {
    const page = {
      goto: vi.fn()
    } as unknown as Page;
    const site = MainSite(page, "https://example.com");
    expect(site.home).toBeInstanceOf(TestHomePage);
    const { baseUrl } = site.home as unknown as { baseUrl: string };
    expect(baseUrl).toBe("https://example.com");
    await site.home.goto();
    expect(page.goto).toHaveBeenCalledWith("https://example.com/boop");
  });
});
