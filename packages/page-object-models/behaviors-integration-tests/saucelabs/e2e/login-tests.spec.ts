import 'reflect-metadata';
import { HasTitle, Is, FocusGroup, Participant } from '@autometa/behaviors';
import { Users } from '../communities/community';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import {
  AddFirstItemToBasket,
  Logout,
  OpenMenu,
} from '../behaviours/actions/product-page-actions';
import { credentials } from '../communities/credentials';
import { SauceDemoPage } from '../page-objects/pages/homepage';
import { LoginErrorMessage } from '../behaviours/observations/homepage-observers';
import { LoginError } from '../behaviours/observations/error-messages';
jest.setTimeout(10000);

describe('Login Tests', () => {
  let Johnny: Participant;
  beforeEach(() => (Johnny = FocusGroup.begin(Users)));
  it('Johnny Should Successfully Log In as a Standard User', async () => {
    await Johnny.will(LoginAs(credentials.Johnny))
      .see(SauceDemoPage, HasTitle('Swag Labs'))
      .will(AddFirstItemToBasket, OpenMenu, Logout);
  });

  it('Johnny Cannot Log In Without a Username', async () => {
    await Johnny.will(LoginAs(credentials.NoUsername)).see(
      LoginErrorMessage,
      Is(LoginError.NoUsername)
    );
  });
});
