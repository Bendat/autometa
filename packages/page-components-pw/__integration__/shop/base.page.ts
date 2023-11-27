import { WebPage } from "../../src";
import { StoreMenu } from "./navigation-bar.component";

export abstract class BasePage extends WebPage {
  abstract menu: StoreMenu;
}
