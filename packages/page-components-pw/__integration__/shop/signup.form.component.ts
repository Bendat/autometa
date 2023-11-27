import { Component } from "../../src/component";
import {
  Button,
  BySelector,
  TextInput
} from "../../src";


export class SignUpForm extends Component {
  @BySelector(TextInput, "#firstname")
  firstName: TextInput;

  @BySelector(TextInput, "#lastname")
  lastName: TextInput;

  @BySelector(TextInput, "#email_address")
  email: TextInput;

  @BySelector(TextInput, "#password")
  password: TextInput;

  @BySelector(TextInput, "#password-confirmation")
  passwordConfirmation: TextInput;

  @BySelector(Button, "button.action.submit.primary")
  createAccount: Button;

  submit() {
    return this.createAccount.click();
  }

  async signUp(
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.passwordConfirmation.fill(password);
    await this.submit();
  }
}
