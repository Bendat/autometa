# Actions

Actions are behaviors which alter the state of the page some how. Some actions
are simple, such as clicking a button, while others might be more complex such
as executing the flow of a log in - typing a username, password and clicking the log in button.

Actions are defined by calling the `ActionOn` function on either a `WebPage` class or an `Observation`. They can also be wrapped in function calls so tests may provide additional data.

```ts title'Continuin from the Observations example'
export const ToggleTheme = ActionOn(DarkmodeButton, ({ click }) => click());

export const LogInAs = (user: UserCredentials) =>
  ActionOn(
    LoginModal,
    async ({ usernameField, passwordField, loginButton }) => {
      await usernameField.write(user.username);
      await passwordField.write(user.password);
      await loginButton.click();
    }
  );

// Example credentials manager somewhere in your project
export interface Credentials {
  username: string;
  password: string;
}

export interface CredentialsManager {
  [user: string]: Credentials;
}
```

The `LoginModal` component might already define a method for logging in with the same details as the above. To simply actions, one could simply call that method.

```ts title'Complex Page Component Methods'
export const ToggleTheme = ActionOn(DarkmodeButton, ({ click }) => click());

export const LogInAs = (user: UserCredentials) =>
  ActionOn(
    LoginModal,
    async (modal) => modal.login(user);
  );

// Example credentials manager somewhere in your project
export interface Credentials {
  username: string;
  password: string;
}

export interface CredentialsManager {
  [user: string]: Credentials;
}
```

:::tip
User behaviors have a future-tense theme. The user _will_ do something. Action
names should reflect that, and be named to read well as a sentence, including arguments
where possible.

Here we can read our behavior as

_The user **will** Toggle Theme_

_The user **will** Login As User 'Johnny'_
:::
