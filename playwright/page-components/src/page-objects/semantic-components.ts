import { FillOptions, PressOptions } from "./locator-options";
import { SemanticComponent } from "./semantic-component";

/**
 * Semantic Component modelling a Button-like element,
 * which can be read or clicked.
 */
export class Button extends SemanticComponent {
  declare textContent: SemanticComponent["textContent"];
  declare click: SemanticComponent["click"];
  declare tap: SemanticComponent["tap"];
}

/**
 * Semantic component modelling a checkbox which can be toggled
 * on or off
 */
export class CheckBox extends SemanticComponent {
  declare check: SemanticComponent["check"];
  declare uncheck: SemanticComponent["uncheck"];
  declare isChecked: SemanticComponent["isChecked"];
  declare click: SemanticComponent["click"];
  declare tap: SemanticComponent["tap"];
  declare press: SemanticComponent["press"];
}
/**
 * Semantic component modelling a radio which can be selected.
 */
export class RadioButton extends SemanticComponent {
  declare check: SemanticComponent["check"];
  declare isChecked: SemanticComponent["isChecked"];
  declare click: SemanticComponent["click"];
  declare tap: SemanticComponent["tap"];
  declare press: SemanticComponent["press"];
}

/**
 * Semantic component modelling textual element, like
 * a paragraph or span.
 */
export class Text extends SemanticComponent {
  declare textContent: SemanticComponent["textContent"];
  declare allTextContent: SemanticComponent["allTextContents"];
}

export class Anchor extends SemanticComponent {
  declare textContent: SemanticComponent["textContent"];
  declare click: SemanticComponent["click"];
  declare tap: SemanticComponent["tap"];
}

export class TextInput extends SemanticComponent {
  get placeholder() {
    return this.getAttribute("placeholder");
  }
  declare textContent: SemanticComponent["textContent"];
  declare click: SemanticComponent["click"];
  declare type: SemanticComponent["type"];
  declare fill: SemanticComponent["fill"];
  declare tap: SemanticComponent["tap"];
  declare press: SemanticComponent["press"];

  enter = async (
    text: string,
    fillOptions?: FillOptions,
    pressOptions?: PressOptions
  ) => {
    await this.fill(text, fillOptions);
    await this.press("Enter", pressOptions);
  };
}
