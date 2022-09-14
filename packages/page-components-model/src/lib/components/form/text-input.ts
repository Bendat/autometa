import { Key } from 'selenium-webdriver';
import { Input } from './input';

export class TextInput extends Input {
  write = async (text: string | number, pressEnter?: boolean) => {
    await this.write(text);
    if (pressEnter) {
      await this.write(Key.ENTER);
    }
  };
}

export class TextArea extends Input  {
  get text() {
    return this.value;
  }

  write = async (text: string | number) => {
    await this.click();
    await super.write(text);
  };
}
