# Writing Tests

Tests are lead by a `User` of a `Community` and are written from
that users perspective.

To start a test, declare a user, create a community in `beforeEach`
and assign the respective user from the community.

:::tip
This example uses Jest but Cucumber can also be used
:::

```ts
describe('MySite E2E tests', () => {
  let Johnny: User;
  beforeEach(() => (Johnny = Community.of(MyCommunity).following('Johnny')));
  //alternatively
  beforeEach(
    () => (Johnny = Community.of(MyCommunity).following(({ Johnny }) => Johnny))
  );
});
```

To create our test, we must have [`Action`s](./actions) and [`Observation`s](./observations) defined which our users can access.

Assume we have the following `WebPages`

```ts
export class MyHomePage extends WebPage {
  @component(By.id('login-btn'))
  loginButton: Button;
  @component(By.id('login-modal'))
  loginModal: LoginModal;
}

export class MyTodoPage extends WebPage {
  @component(By.id('add-todo-input'))
  addTodoItemInput: Button;
  @component(By.id('add-todo-button'))
  addTodoItemButton: Button;
  @collection(By.id('todo-list'), TodoEntry, By.css('li'))
  currentTodos: Collection<TodoEntry>;
}
```

and these `Component`s

```ts
export class LoginModal extends Component {
  @component(By.id('username-field'))
  usernameField: TextInput;
  @component(By.id('password-field'))
  passwordField: TextInput;
  @component(By.id('log-user-in-btn'))
  loginButton: Button;
}

export class TodoEntry extends Component {
  @component(By.className('todo-completed-checkbox'))
  isCompletedCheckbox: Checkbox;
  @component(By.css('p'))
  todoDescription: Paragraph;
}
```

We can start making observations:

```ts
const LoginArea = Observe(MyHomePage, ({ loginModal }) => loginModal);
const TodoEntry = (atIndex: number) =>
  Observe(MyTodoPage, ({ currentTodos: { at } }) => at(atIndex));
const TodoCount = Observe(MyTodoPage, (currentTodos: { length }) => length);
```

:::tip
Not every (or indeed any) component needs an observations. Actions can iterate
through a page also like observers do, however observers promote composition
:::

Next some actions:

```ts
const LoginAs = (username: string, password: string) =>
  ActionOn(LoginArea, async ({ usernameField, passwordField, loginButton }) => {
    await usernameField.write(username);
    await passwordField.write(password);
    await loginButton.click();
  });

const AddToDo = (description: string) =>
  ActionOn(ToDoPage, async ({ addTodoItemInput, addTodoItemButton }) => {
    await addTodoItemInput.write(description);
    await addTodoItemButton.click();
  });

const MarkToDoCompleted = (atIndex: number) =>
  ActionOn(
    TodoEntry(atIndex),
    async ({ addTodoItemInput, addTodoItemButton }) => {
      await isCompletedCheckbox.select();
    }
  );
```

Now we can write out test scenario:

:::tip
The behavior keywords are dynamic and can accommodate direct or fluent
language. For example, the `and` method can be called with the same type of argument
as its preceding call (actions for `will` and observations for `see`), or it can be
used as a property to access other behaviors such as `will` and `see`

Example:

```ts
Johnny.will(DoSomething).and(DoSomethingElse).and.see(SomeObservation, SomeAssertion);

Johnny.will(DoSomething).and.will(DoSomethingElse).and.see(SomeObservation, Some Assertion)

Johnny.will.see(SomeObservation, SomeAssertion).and(SomeOtherObservation,SomeOtherAssertion )
```

All of these are valid. Note that `and` accommodates the arguments of the
most recently called behavior.

:::

```ts title='Using Jest'
import { myEnv } from '../';
import { User, Community } from '@autometa/behaviors';
import { LoginAs, AddToDo, MarkToDoComplete } from './my-actions';

describe('MySite E2E tests', () => {
  let Johnny: User;
  beforeEach(() => (Johnny = Community.of(MyCommunity).following('Johnny')));

  // List of actions
  test('Johnny should login, add a new "to do" and mark the first entry completed', async () => {
    await Johnny.will(
      loginAs(myEnv.username, myEnv.password),
      AddToDo('pass this test'),
      MarkToDoCompleted(0)
    );
  });

  // Chain of actions
  test('Johnny should login, add a new "to do" and mark the first entry completed', async () => {
    await Johnny.will(loginAs(myEnv.username, myEnv.password))
      .and(AddToDo('pass this test'))
      .and(MarkCompleted(0));
  });
});
```

## Assertions

You can make assertions about the state of the world with the `see` method, passing an observation we have made and providing an assertion to verify it.

```ts title='Using Jest'
import { myEnv } from '../';
import { User, Community } from '@autometa/behaviors';
import { LoginAs, AddToDo, MarkToDoComplete } from './my-actions';

describe('MySite E2E tests', () => {
  let Johnny: User;
  beforeEach(() => (Johnny = Community.of(MyCommunity).following('Johnny')));

  test('Johnny should login, add a new "to do" and mark the first entry completed', async () => {
    await Johnny.will(loginAs(myEnv.username, myEnv.password))
      .see(TodoCount, Is(0))
      .will(AddToDo('pass this test'), MarkToDoCompleted(0))
      .see(TodoCount, Is(1));
  });

});
```
