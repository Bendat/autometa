import { given, then, when } from '@autometa/cucumber';
import { Injectable } from '@autometa/dependency-injection';
import { World } from '@autometa/store';

@Injectable()
export default class MyStepsClass {
  constructor(public world: World) {}
  @given('a registered user')
  givenARegisteredUser = () => {
    this.world.x = 5;
    console.log('given a registered user');
  };

  @when("they enter their username '{word}'")
  whenEnterUsername = (username: string) => {
    console.log('when username ' + username);
    console.log('x ' + this.world.x);
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
