import { Browser, Builder } from "selenium-webdriver";
import {driver, role, browses, Community, User}  from '@autometa/behaviors'


@driver(new Builder().forBrowser(Browser.CHROME))
export class Users extends Community {
  @role('Standard User')
  @browses('https://www.saucedemo.com/')
  Johnny: User;

  @role('Locked User')
  @browses('localhost')
  Jenny: User;
}
