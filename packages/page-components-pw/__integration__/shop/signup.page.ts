import { expect } from "@playwright/test";
import { BySelector } from "../../src";
import { SignUpForm } from "./signup.form.component";
import { PageHeader } from "./page-header.component";
import { BasePage } from "./base.page";
import { StoreMenu } from "./navigation-bar.component";

export class SignupPage extends BasePage {
  route = "customer/account/create/";
  @BySelector(StoreMenu, "#store.menu ul")
  menu: StoreMenu;
  @BySelector(PageHeader, ".page-header")
  header: PageHeader;

  @BySelector(SignUpForm, ".form-create-account")
  signUpForm: SignUpForm;

  async signUp(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) {
    await this.signUpForm.signUp(firstName, lastName, email, password);
    await expect(this.page).toHaveTitle("My Account");
  }
}
