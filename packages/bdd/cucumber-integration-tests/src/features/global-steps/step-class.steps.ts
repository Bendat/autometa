// import { given, then, when } from '@autometa/cucumber';
import { given, then, when } from '@autometa/cucumber';
import { injectable } from 'tsyringe';

export default class MyStepsClass {
  @given('a registered user')
  givenARegisteredUser = () => {
    console.log('given a registered user');
  };

  @when("they enter their username '{word}'")
  whenEnterUsername = (username: string) => {
    console.log('when username ' + username);
  };

  @when("they enter their password '{word}'")
  whenEnterPassword = (password: string) => {
    console.log('when password' + password);
  };

  @then('they are presented with their profile')
  thenProfilePresented = () => {
    console.log('profile presented');
  };
  
  @then('an error is displayed')
  thenErrorIsDisplayed = () => {
    console.log('error displayed');
  };
}
