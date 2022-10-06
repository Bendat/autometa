# Subplots

A Subplot is a secondary story, portrayed by a secondary `User`, which
complements the Scenario Under Test.

For example, if your website has an admin portal, accessible only
to administrators, store owners, etc, then you may wish to interact
with that portal in a new tab or window to verify that something the
user (the user whom the test scenario primarily follows, the user of your product) is properly reflected in the admin portal.

Subplots are activated with the `meanwhile` method on a User and will
pause the execution of the user story until the subplot has resolved. Subplots can also be paused and resumed later after further user actions.

```ts title='Example Subplot'
test('Johnny books a session, Jenny sees it on admin', async () => {
  await Johnny.will(Login, CheckTomorrow, BookSession('10:30'))
    .meanwhile(
      Jenny.will(
        LoginToAdminPortal,
        OpenBookings,
        SeeBookingAt('10:30'),
        ConfirmBookingFor('Johnny')
      ),
      Tab('admin portal', New),
      Which(ClosesTo, 'initial')
    )
    .and.will(Logout);
});
```
:::warn
Do not `await` the user of a subplot in the subplot.
:::

`meanwhile` also requires a description of how it should be handled. In the above example, Jennys subplot will take place on a `New` `Tab`. A `New` tab or
window will automatically be opened with the URL defined on the User themselves with the `@browses` decorator. Alternatively, the tab or window could be `Open`ed with a url: `Open('google.com')`.

The name provided to the tab ('admin portal') allows the test to return to that tab later (if it isn't closed).

The last parameter describes what the tab or window will do after the subplot has completed. This example will close the tab, and return to the initial (Johnnys) tab. `initial` is automatically assigned to the top level story (Johnnys test scenario). The tab could also `MinimizeTo` initial and be returned
to later.

After the subplot is over, execution is returned to the parent plot (Johnnys) which will continue. Subplots can be nested (but probably shouldn't be)