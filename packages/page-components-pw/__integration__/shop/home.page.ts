import { expect } from "@playwright/test";
import { BySelector } from "../../src";
import { PageHeader } from "./page-header.component";
import { PromotionWidget } from "./promotion.widget.component";
import { BasePage } from "./base.page";
import { StoreMenu } from "./navigation-bar.component";

export class HomePage extends BasePage {
  @BySelector(StoreMenu, "nav")
  menu: StoreMenu;
  route = "/";
  @BySelector(PageHeader, ".page-header")
  header: PageHeader;

  @BySelector(PromotionWidget, ".block-promo.home-main")
  highlight: PromotionWidget;

  async goToSignUp() {
    await this.header.signUp.click();
    await expect(this.page).toHaveTitle("Create New Customer Account");
  }

  async goToSignIn() {
    await this.header.signIn.click();
    await expect(this.page).toHaveTitle("Customer Login");
  }
}
