import { Builder } from 'selenium-webdriver';
import {
  Browser,
  Vendor,
  Role,
  Browses,
  Facilitator,
  Participant
} from '@autometa/behaviors';
import * as firefox from 'selenium-webdriver/firefox';

const wbBuilder = new Builder()
  .forBrowser(Vendor.FIREFOX)
  .setFirefoxOptions(new firefox.Options().headless())
@Browser(wbBuilder)
export class Users  {
  @Role('Standard User')
  @Browses('https://www.saucedemo.com/')
  @Facilitator
  Johnny: Participant;

  @Role('Locked User')
  @Browses('https://google.com')
  Jenny: Participant;
}
