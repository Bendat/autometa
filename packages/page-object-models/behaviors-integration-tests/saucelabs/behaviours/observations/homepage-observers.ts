import { Observe } from '@autometa/behaviors';
import { SauceDemoPage } from '../../page-objects/pages/homepage';

export const LoginBox = Observe(SauceDemoPage, ({ loginBox }) => loginBox);

export const LoginErrorMessage = Observe(
  LoginBox,
  ({ errorMessage: { text } }) => text
);
