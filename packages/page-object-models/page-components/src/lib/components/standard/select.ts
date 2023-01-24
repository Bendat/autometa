import { By } from 'selenium-webdriver';
import { ClickOn } from '../../meta-types/actions';
import { Component } from '../../meta-types/component';
import { Collection } from '../groups/collection';

/**
 * Represents the `<select>` tag. Acts as a a { @see Collection }
 * of { @see Option }.
 */
export class Select extends Collection<Option> {
  protected childType = Option;
  protected childElementLocator: By = By.css('option');
  protected override childIdentifierString = 'Option';

  get value() {
    return this.getAttribute('value');
  }

  /**
   * Selects an { @see Option } based on some locator
   * and returns it, by first clicking on this dropdown
   * and then by clicking on the chosen option
   *
   * @param by The locator to find an Option by
   * @returns The Option Component that matches that locator
   */
  choose = async (byOrIndex: By | number | string) => {
    await this.click();
    const selected = await this.at(byOrIndex);
    return selected?.choose();
  };

  click: ClickOn = this.click;
}

/**
 * Represents the `<option>` tag.
 */
export class Option extends Component {
  /**
   * Retrieves the inner text of this Option,
   * which is the text displayed to the browser.
   *
   * This may or may not be equivalent to the
   * value, depending on the option itself.
   *
   * @returns a promise which resolves to the options inner text
   */
  get displayedText() {
    return this.read();
  }

  /**
   * Retrieves the value of this option is set. If no value is
   * set, the inner text of the option is used.
   *
   * @returns a promise which resolves to the options actual value
   */
  get value() {
    return this.getAttribute('value');
  }

  /**
   * Retrieves the label attribute for this option.
   *
   * @returns a promise that resolves to the label attribute value.
   */
  get label() {
    return this.getAttribute('label');
  }

  /**
   * { @aliasOf WebElement.Click }
   *
   * Chooses this option by clicking on it.
   */
  choose = this.click;

  /**
   * Alias for {@see Select.choose}
   */
  click: ClickOn = this.click;
}

export class OptionGroup extends Collection<Option> {
  protected childType = Option;
  protected childElementLocator: By = By.css('option');

  get text() {
    return super.read();
  }
}
