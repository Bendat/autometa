import { Key } from 'selenium-webdriver';
import { SendKeys } from '../../meta-types/actions';
import { Input } from './input';
export interface SendKeysEnter {
  (text: string | number, pressEnter?: boolean): Promise<void>;
}

export class TextInput extends Input {
  write: SendKeys = async(...input: (string | number)[]): Promise<void> => {
    await this.write(...input);
  };

  /**
   * Writes the provided text into the input, pressing the 'enter' key
   * once complete.
   * 
   * @param input 
   */
  enter: SendKeys = async(...input: (string | number)[]): Promise<void> => {
    await this.write(...input, Key.ENTER);
  };
}

export class TextArea extends Input {
  get text() {
    return this.value;
  }

  /**
   * TextAreas must be clicked or focused on before sending keys.
   * This implementation of write automatically clicks on the
   * element before writing.
   * 
   * @inheritDoc
   */
  write: SendKeys = async (text: string | number) => {
    await this.click();
    await super.write(text);
  };
}
