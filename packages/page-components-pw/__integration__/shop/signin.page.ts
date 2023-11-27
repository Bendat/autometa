import { expect } from "@playwright/test";
import { WebPage } from "../../src/component";
import { BySelector } from "../../src";
import { SignInForm } from "./signin.form.component";
import { PageHeader } from "./page-header.component";
import { BasePage } from "./base.page";
import { StoreMenu } from "./navigation-bar.component";

export class SignInPage extends BasePage {
  route = "customer/account/login/";
  @BySelector(StoreMenu, "#store.menu ul")
  menu: StoreMenu;
  @BySelector(PageHeader, ".page-header")
  header: PageHeader;

  @BySelector(SignInForm, ".form-login")
  signInForm: SignInForm;

  async signInAs(email: string, password: string) {
    await this.signInForm.enterCredentials(email, password, true);
  }
}
