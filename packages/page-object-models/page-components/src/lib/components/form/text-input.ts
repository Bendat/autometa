import { Key } from 'selenium-webdriver';
import { SendKeys } from '../../meta-types/actions';
import { Input } from './input';
export interface SendKeysEnter {
  (text: string | number, pressEnter?: boolean): Promise<void>;
}

export class TextInput extends Input {
  write: SendKeys = this.write;

  /**
   * Writes the provided text into the input, pressing the 'enter' key
   * once complete.
   *
   * @param input
   */
  enter: SendKeys = async (...input: (string | number)[]): Promise<void> => {
    await this.write(...input, Key.ENTER);
  };
}

export class TextArea extends Input {
  get text() {
    return this.value;
  }

  write: SendKeys = this.write;

  /**
   * TextAreas must be clicked or focused on before sending keys.
   * This implementation of write automatically clicks on the
   * element before writing.
   */
  enterText = async (text: string | number) => {
    await this.click();
    await this.write(text);
  };
}
