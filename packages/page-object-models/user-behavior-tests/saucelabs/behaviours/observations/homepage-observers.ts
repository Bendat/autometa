import { Observe } from '@autometa/behaviors';
import { SauceDemo } from '../../page-objects/pages/homepage';

export const LoginBox = Observe(SauceDemo, ({ loginBox }) => loginBox);

export const LoginErrorMessage = Observe(
  LoginBox,
  ({ errorMessage: { text } }) => text
);
