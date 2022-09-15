# Forms

Assume we have a Page with the following DOM, with
no classes or IDs

```html
<body>
  <form>
    <input type="text" />
    <label>Name</label>
    <textarea />
    <label>Description</label>
    <fieldset>
      <legend>Role</legend>
      <input type="radio" name="role" value="seller" />
      <label>Seller</label>
      <input type="radio" name="role" value="buyer" />
      <label>Buyer</label>
    </fieldset>
    <fieldset>
      <legend>Setup</legend>
      <input type="checkbox" name="setup" value="setup-itl-account" />
      <label>Set up an international account?</label>
      <input type="checkbox" name="setup" value="use-cloud-service" />
      <label>Use cloud service for processing?</label>
    </fieldset>
    <input type="submit" />
  </form>
</body>
```

This time we'll start by writing our most nested components, the field sets.

```ts
export class RoleFieldSet extends Component {
  @component(By.css('input[type="radio"]'))
  seller: Checkbox;

  @component(By.css('input[type="radio"]:last-of-type'))
  buyer: CheckBox;
}

export class SetupFieldSet extends Component {
  @component(By.css('input[type="checkbox"]'))
  internationalAccount: RadioButton;

  @component(By.css('input[type="checkbox"]:last-of-type'))
  useCloudService: RadioButton;
}
```

We can add the `<label>`s the same way if they will be tested.

Now we can build our form. For this example we'll skip the `<form>` tag and treat the page as our root container, however for pages
with multiple complex behaviors, they should be placed in their own
components.

```ts
export class MyFormPage extends WebPage {
  @component(By.css('input'))
  nameInput: TextInput;

  @component(By.css('textarea'))
  description: TextArea;

  @component(By.css('fieldset'))
  roleSettings: RoleFieldSet;

  @component(By.css('fieldset:last-of-type'))
  setupSettings: SetupFieldSet;

  @component(By.css('input[type="submit"'))
  submitForm: SubmitButton;
}
```

Onto our test

```ts title='Using Jest Or Mocha'
const url = process.env.MY_URL;
const wdBuilder = new Builder().forBrowser(Browser.Chrome);
const site = Site(url, wdBuilder);

describe('Submitting my application form', () => {
  let page: MyPage;

  beforeEach(async () => {
    page = await site.browse(MyPage);
  });

  it('should fill and submit my application form', async () => {
    const {
      nameInput,
      description,
      roleSettings: { buyer, seller },
      setupSettings: { internationalAccount, useCloudService },
      submitButton,
    } = page;

    await nameInput.write('Bob Franklin');
    await description.write('I am an appealing candidate because....');
    await seller.select();
    await internationalAccount.select();

    expect(await buyer.isSelected).toBe('false');
    expect(await useCloudService.isSelected).toBe('false');

    await submitButton.submit();
    await page.waitForTitleIs('Application Submitted');
  });
});
```

It's likely this behavior will be repeated across tests, it's
a good idea to compose it into a method on the Component or page
object.

We can start with our field sets.

```ts
export class RoleFieldSet extends Component {
  @component(By.css('input[type="radio"]'))
  seller: Checkbox;

  @component(By.css('input[type="radio"]:last-of-type'))
  buyer: CheckBox;

  select = async (role: 'buyer' | 'seller') => {
    const checkbox = this[role] as Checkbox;
    await checkbox.click();
  };
}

export class SetupFieldSet extends Component {
  @component(By.css('input[type="checkbox"]'))
  internationalAccount: RadioButton;

  @component(By.css('input[type="checkbox"]:last-of-type'))
  useCloudService: RadioButton;

  select = async (
    useInternationalAccount: boolean,
    useCloudService: boolean
  ) => {
    if (useInternationalAccount) {
      await this.internationalAccount.select();
    }
    if (useCloudService) {
      await this.internationalAccount.select();
    }
  };
}
```

And now our form

```ts
export class MyFormPage extends WebPage {
  @component(By.css('input'))
  nameInput: TextInput;

  @component(By.css('textarea'))
  description: TextArea;

  @component(By.css('fieldset'))
  roleSettings: RoleFieldSet;

  @component(By.css('fieldset:last-of-type'))
  setupSettings: SetupFieldSet;

  @component(By.css('input[type="submit"'))
  submitForm: SubmitButton;

  submitApplication = async (
    name,
    description,
    role: string,
    useIntl: boolean,
    useCloud: boolean // could also you a JSON object instead of params
  ) => {
    await this.nameInput.write(name);
    await this.description.write(description);
    await this.roleSettings.select(role);
    await this.setupSettings.select(useIntl, useCloud);
    await this.submitForm.submit();
  };
}
```

And with that our test becomes

```ts title='Using Jest Or Mocha'
const url = process.env.MY_URL;
const wdBuilder = new Builder().forBrowser(Browser.Chrome);
const site = Site(url, wdBuilder);

describe('Submitting my application form', () => {
  let page: MyPage;

  beforeEach(async () => {
    page = await site.browse(MyPage);
  });

  it('should fill and submit my application form', async () => {
    const { submitApplication, waitForTitleIs } = page;

    await submitApplication('bob', 'my description', 'seller', true, false);

    await waitForTitleIs('Application Submitted');
  });
});
```

We could also make it more modular/specific

```ts
export class MyFormPage extends WebPage {
  @component(By.css('input'))
  nameInput: TextInput;

  @component(By.css('textarea'))
  description: TextArea;

  @component(By.css('fieldset'))
  roleSettings: RoleFieldSet;

  @component(By.css('fieldset:last-of-type'))
  setupSettings: SetupFieldSet;

  @component(By.css('input[type="submit"'))
  submitForm: SubmitButton;

  addUserDetails = (name: string, description: string) => {
    await this.nameInput.write(name);
    await this.description.write(description);
  };

  selectSettings = async (
    role: string,
    useIntl: boolean,
    useCloud: boolean
  ) => {
    await this.roleSettings.select(role);
    await this.setupSettings.select(useIntl, useCloud);
  };

  submit: Submit = this.submit;
}
```

```ts title='Using Jest Or Mocha'
const url = process.env.MY_URL;
const wdBuilder = new Builder().forBrowser(Browser.Chrome);
const site = Site(url, wdBuilder);

describe('Submitting my application form', () => {
  let page: MyPage;

  beforeEach(async () => {
    page = await site.browse(MyPage);
  });

  it('should fill and submit my application form', async () => {
    const { addUserDetails, selectSettings, submit, waitForTitleIs } = page;

    await addUserDetails('bob', 'my description');
    await selectSettings('seller', true, false);
    await submit();

    await waitForTitleIs('Application Submitted');
  });
});
```
