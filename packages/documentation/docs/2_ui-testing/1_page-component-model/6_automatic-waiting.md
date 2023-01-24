# Automatic Waiting

Components will automatically wait for some condition to be met when they are located by the WebDriver.
By default, all components will wait until `isLocated` has been met.

This value can be overridden in Component subclasses. For example to wait for `isEnabled`

```ts
export class MyComponent extends Component {
  protected override _defaultUntil: UntilCondition = Until.isEnabled;
}
```

By default, waits with this component will check for the 'isEnabled' property before proceeding.

The default condition can also be overridden by referencing a replacement
in the second argument of `@component`

```ts
@component(By.id('foo'), Until.isEnabled)
myButton: Button
```

## Configuring Waits

Waits can be enabled or disabled by either:

- calling `POM.settings.enableComponentAutoWait(true | false)`
  - This must be set early in execution, such as a setup file.
- setting the `SELENIUM_POM_AUTO_WAIT` environment variable.
  - Accepts: [true, false, enabled, disabled]

**Waits are enabled by default**

# Until

The `Until` object provides references to the standard Selenium `until.` functions like `elementIsVisible`. `Until` passes
an `UntilCondition` instance. Components can use this to automatically determine the arguments to pass to the condition,
such as a WebElement or `By` Locator.

Until is accessed similarly to `By` locators.
