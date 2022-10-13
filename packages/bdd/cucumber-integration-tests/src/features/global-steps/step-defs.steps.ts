import { Given, Then, When } from '@autometa/cucumber';
import { World } from '@autometa/store';

Given('a registered user', ({ World }: { World: World }) => {
  World.dog = 'my dog';
  console.log('given a registered user');
});

When(
  "they enter their username '{word}'",
  (username: string, { World }: { World: World }) => {
    console.log(World.dog);
    console.log('when username ' + username);
  }
);

When("they enter their password '{word}'", (password: string) => {
  console.log('when password' + password);
});

Then('they are presented with their profile', () => {
  console.log('profile presented');
});

Then('an error is displayed', () => {
  console.log('error displayed');
});
