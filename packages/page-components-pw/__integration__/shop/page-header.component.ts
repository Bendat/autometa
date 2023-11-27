import { Component } from "../../src/component";
import {
  Anchor,
  AnchorImage,
  Behavior,
  ByLabel,
  BySelector,
  ByText,
  Clickable,
  Image,
  TextInput
} from "../../src";

export class AccountDropdown extends Behavior(Clickable) {
  @ByText(Anchor, "My Account")
  account: Anchor;

  @ByText(Anchor, "My Wish List")
  wishlist: Anchor;

  @BySelector(Anchor, "Sign Out")
  signOut: Anchor;
}

export class PageHeader extends Component {
  @ByLabel(Image, "store logo")
  logo: AnchorImage;

  @BySelector(Anchor, "ul>li:nth-child(2)>a")
  signIn: Anchor;

  @ByText(Anchor, "Create an Account")
  signUp: Anchor;

  @BySelector(TextInput, "#search")
  search: TextInput;

  @BySelector(AnchorImage, ".action.showcart")
  cart: AnchorImage;

  @BySelector(AccountDropdown, "ul.header.links")
  account: AccountDropdown;
}
