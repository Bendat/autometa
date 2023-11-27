import { Root, Website } from "../../src";
import { HomePage } from "./home.page";
import { SignInPage } from "./signin.page";
import { SignupPage } from "./signup.page";

export class Shop extends Website {
  baseUrl = "https://magento.softwaretestingboard.com/";
  @Root(HomePage)
  home: HomePage;
  @Root(SignInPage)
  signin: SignInPage;
  @Root(SignupPage)
  signup: SignupPage;
}
