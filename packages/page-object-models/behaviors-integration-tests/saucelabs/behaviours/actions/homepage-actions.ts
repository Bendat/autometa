import { ActionOn } from '@autometa/behaviors';
import { Credentials } from '../../communities/credentials';
import { LoginBox } from '../observations/homepage-observers';

export const LoginAs = ({ username: uname, password: pword }: Credentials) =>
  ActionOn(LoginBox, async ({ username, password, login }) => {
    await username.write(uname);
    await password.write(pword);
    await login.click();
  });
