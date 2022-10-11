import { Browser, Builder } from 'selenium-webdriver';
import {
  driver,
  role,
  browses,
  User,
  Community,
  plans,
} from '@autometa/behaviors';
import { LoginPlans } from '../plans/user-plans';

@driver(new Builder().forBrowser(Browser.CHROME))
export class Users extends Community {
  @role('Standard User')
  @browses('https://www.saucedemo.com/')
  @plans(LoginPlans)
  Johnny: User<LoginPlans>;

  @role('Locked User')
  @browses('https://google.com')
  @plans(LoginPlans)
  Jenny: User<LoginPlans>;
}
