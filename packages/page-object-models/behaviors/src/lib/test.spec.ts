import 'reflect-metadata';
import {
  Button,
  Component,
  component,
  Site,
  TextInput,
  WebPage,
} from '@autometa/page-components';
import { Browser, Builder, By } from 'selenium-webdriver';
import { ActionOn } from './behaviors/action';
import { Observe } from './behaviors';

// jest.setTimeout(5000000);
jest.setTimeout(10000);


@driver(new Builder().forBrowser(Browser.CHROME))
class Users extends Community {
  @role('Standard User')
  @browses('https://www.saucedemo.com/')
  Johnny: User;

  @role('Locked User')
  @browses('localhost')
  Jenny: User;
}
interface Credentials {
  username: string;
  password: string;
}
const credentials: { [key: string]: Credentials } = {
  Johnny: { username: 'standard_user', password: 'secret_sauce' },
  Jenny: { username: 'locked_out_user', password: 'secret_sauce' },
};
class LoginBox extends Component {
  @component(By.id('user-name'))
  username: TextInput;
  @component(By.id('password'))
  password: TextInput;
  @component(By.id('login-button'))
  login: Button;
}

class SauceDemo extends WebPage {
  @component(By.className('login-box'))
  loginBox: LoginBox;
}

const LoginBoxDiv = Observe(SauceDemo, ({ loginBox }) => loginBox);

// can replace t extends WbPage with extends component?
const LoginAs = ({ username: uname, password: pword }: Credentials) =>
  ActionOn(LoginBoxDiv, async ({ username, password, login }) => {
    await username.write(uname);
    await password.write(pword);
    await login.click();
  });

const Page = Observe(SauceDemo, (page) => page);

class Crow {
  async then(
    onFulfilled?:
      | ((value: number) => any | PromiseLike<number>)
      | undefined
      | null
  ): Promise<number | never> {
    const foo = await Promise.resolve(4);
    if (onFulfilled) {
      return await onFulfilled(foo);
    }
    return foo;
  }
}
test('foo', ()=>{
  new Builder().forBrowser(Browser.CHROME).build()
})
describe('foo', () => {
  let Johnny: User;
  beforeEach(async () => ({ Johnny } = await ActingAs(Users).leadBy('Johnny')));
  // afterEach(()=> Johnny.finish())
  it('does the test', async () => {

    await Johnny.will(LoginAs(credentials.Johnny))
    .see(SauceDemo, HasTitle('Swag Labs'))
    .think(For(10, Seconds), 'my thoughts');
    // await new Promise(r=>setTimeout(r, 10000))
    await Johnny.finish()
    // await Johnny.run()
    // await Johnny.run();
    //     await Johnny.will(LoginAs(credentials.Johnny), LoginAs)
    //     .see(Page, HasTitle('my title'))
    //     .and(Page, HasTitle('my title'))
  });
});
