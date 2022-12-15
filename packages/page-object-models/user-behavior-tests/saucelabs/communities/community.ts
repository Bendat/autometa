import { Browser, Builder } from 'selenium-webdriver';
import {
  browser,
  role,
  browses,
  User,
  FocusGroup,
  plans,
  facilitator,
} from '@autometa/behaviors';
import { LoginPlans } from '../plans/user-plans';

@browser(new Builder().forBrowser(Browser.CHROME))
export class Users extends FocusGroup {
  @role('Standard User')
  @browses('https://www.saucedemo.com/', {
    login: 'login.php',
    basket: 'basket.php',
  })
  @plans(LoginPlans)
  @facilitator
  Johnny: User<LoginPlans>;

  @role('Locked User')
  @browses('https://google.com')
  @plans(LoginPlans)
  Jenny: User<LoginPlans>;
}
