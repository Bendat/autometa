import { Anchor, BySelector, CollectionComponent, Component } from "../../src";

export class StoreMenu extends CollectionComponent<Anchor> {
  childType = Anchor;

  async select(name: string | RegExp, parent?: Component) {
    const expr = new RegExp(`^${name}`);
    const link = this.by.selector("li", { hasText: expr }, parent);
    return await link.locator.locator("a").first().click();
  }

  async hover(entry: string, parent?: Component) {
    const expr = new RegExp(`^${entry}`);
    const link = this.by.selector("li", { hasText: expr }, parent);
    await link.locator.locator("a").first().hover();
    await this.page.waitForSelector("ul.submenu");
    return link;
  }
}
