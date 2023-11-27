import {
  Behavior,
  Button,
  ByRole,
  BySelector,
  Clickable,
  Image,
  Text
} from "../../src";


export class PromotionWidget extends Behavior(Clickable) {
  @ByRole(Image, "img")
  image: Image;

  @BySelector(Text, ".content .info")
  info: Text;

  @BySelector(Text, ".content .title")
  title: Text;

  @BySelector(Button, ".content .action.more.button")
  button: Button;
}
