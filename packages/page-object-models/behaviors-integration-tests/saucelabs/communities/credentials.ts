export interface Credentials {
  username: string;
  password: string;
}
export const credentials: { [key: string]: Credentials } = {
  Johnny: { username: 'standard_user', password: 'secret_sauce' },
  Jenny: { username: 'locked_out_user', password: 'secret_sauce' },
  NoMatch: { username: 'asdasd', password: 'asdasd' },
  NoUsername: { username: '', password: 'secret_sauce' },
  NoPassword: { username: 'standard_user', password: '' },
};
