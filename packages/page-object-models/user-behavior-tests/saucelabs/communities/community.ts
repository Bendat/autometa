import { Browser, Builder } from 'selenium-webdriver';
import {
  driver,
  role,
  browses,
  User,
  Community,
  plans,
} from '@autometa/behaviors';
import { JohnnyLoginPlans } from '../plans/user-plans';

@driver(new Builder().forBrowser(Browser.CHROME))
export class Users extends Community {
  @role('Standard User')
  @browses('https://www.saucedemo.com/')
  @plans(JohnnyLoginPlans)
  Johnny: User<JohnnyLoginPlans>;

  @role('Locked User')
  @browses('https://google.com')
  Jenny: User;
}
