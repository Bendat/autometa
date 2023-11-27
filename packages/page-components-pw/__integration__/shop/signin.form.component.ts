import { Component } from "../../src/component";
import { Button, BySelector, TextInput } from "../../src";

export class SignInForm extends Component {
  @BySelector(TextInput, "#email")
  email: TextInput;

  @BySelector(TextInput, "#email-error")
  emailError: TextInput;

  @BySelector(TextInput, "#pass")
  password: TextInput;

  @BySelector(TextInput, "#pass-error")
  passwordError: TextInput;

  @BySelector(Button, "button.action.login.primary")
  signIn: Button;

  submit() {
    return this.signIn.click();
  }

  async enterCredentials(email: string, password: string, submit?: boolean) {
    await this.email.fill(email);
    await this.password.fill(password);
    if (submit) {
      await this.submit();
    }
  }
}
