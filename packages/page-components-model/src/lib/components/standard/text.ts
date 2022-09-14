import { InjectableComponent } from "../../decorators/injectables";
import { Component } from "../../meta-types/component";
import { Until } from "../../until/until";

@InjectableComponent()
export class Text extends Component {
  protected override _defaultUntil = Until.isVisible;
  get text(){
    return super.text
  }

}

export class Paragraph extends Text{}
export class Header extends Text{}
export class Heading1 extends Text{}
export class Heading2 extends Text{}
export class Heading3 extends Text{}
export class Heading4 extends Text{}
export class Heading5 extends Text{}
export class Heading6 extends Text{}
export class Italics extends Text{}
export class Bold extends Text{}
export class Strong extends Text{}
export class Span extends Text{}
export class Label extends Text{}
export class Legend extends Text{}
