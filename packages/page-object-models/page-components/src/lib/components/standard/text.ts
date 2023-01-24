import { InjectableComponent } from '../../decorators/injectables';
import { Component } from '../../meta-types/component';
import { Until } from '../../until/until';

@InjectableComponent()
export class TextComponent extends Component {
  protected override _defaultUntil = Until.isVisible;
  get text() {
    return super.read();
  }
}

export class Paragraph extends TextComponent {}
export class Header extends TextComponent {}
export class Heading1 extends TextComponent {}
export class Heading2 extends TextComponent {}
export class Heading3 extends TextComponent {}
export class Heading4 extends TextComponent {}
export class Heading5 extends TextComponent {}
export class Heading6 extends TextComponent {}
export class Italics extends TextComponent {}
export class Bold extends TextComponent {}
export class Strong extends TextComponent {}
export class Span extends TextComponent {}
export class Label extends TextComponent {}
export class Legend extends TextComponent {}
