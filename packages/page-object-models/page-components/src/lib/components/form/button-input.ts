import { ClickOn } from '../../meta-types/actions';
import { Button } from '../standard/button';
import { Input } from './input';

/**
 * Represents the tag `<input type='button'>`
 */
export class ButtonInput extends Input implements Button {}
/**
 * Represents the tag `<input type='submit'>`
 */
export class SubmitButton extends ButtonInput {}
/**
 * Represents the tag `<input type='reset'>`
 */
export class ResetButton extends ButtonInput {}

class ToggleableButton extends ButtonInput {
  get isSelected(): Promise<boolean> {
    return super.isSelected;
  }

  click: ClickOn = this.click;
  /**
   * Selects this input by clicking on it.
   */
  select: ClickOn = this.click;
}
/**
 * Represents the tag `<input type='radio'>`
 */
export class RadioButton extends ToggleableButton {}

/**
 * Represents the tag `<input type='check'>`
 */
export class Checkbox extends ToggleableButton {}
