# Observations

Unlike a Page Object Model, which defines in as much detail as necessary
how a web page should look, i.e which defines it's actual shape, the user
naturally breaks it down visually into components they can see, interact with
or tangibly recognize.

To emulate this, Page Objects - which are structured and coupled by nature, are broken up again into single composable units that are of direct interest to the user, which are `Observation`s.

Some observations a user makes act as visual waypoints, a recognizable place
to look for more specific components on the page. For example for a side bar with a search bar and list of filters, to find a filter they want they would first look for the side bar, then focus on the options section, then scan through the available filters to find what they want.

Other observations, such as the filter toggle the user wished to select,
are more `Action`able. The user is looking for them so that they may interact
with them in some way, and proceed with their goal on the product, such as
making a purchase.

Observations build on top of Page Components. To make an Observations,
pass a reference for a `WebPage` class (not instance) to the `Observe` function,
which also accepts a transformer function, that converts a page object to a value from that page object (which may be another page object such as a Component, or a value from a Component, such as it's `text`)

:::tip
Observers should be named in `PascalCase` by convention, as are most
other declarative behaviors.

:::

```ts title=Example
export const LoginModal = Observe(MyHomePage, ({ loginModal }) => loginModal);
export const ParagraphText = Observe(
  MyHomePage,
  ({ someParagraph: { text } }) => text
);
export const DarkModeButton = Observe(MyHomePage, ({ someButton }) => text);
```

An observer can also be composed with another Observer. This allows access to
observations from a component, not just a page.

```ts
export const UsernameInput = Observe(
  LoginModal,
  ({ usernameField }) => usernameInput
);
```

:::tip

Observations should be named so that they read well when composed into `Action`s
and into tests.

For example, in tests, an observation is invoked by what the user `see`s something.

Here we can read our observations as:

_The user will **see** the Login Modal_

_The user will **see** the Username Input_
:::

Observers need not be too granular. They can be further composed into `Action`s
which may access inner elements directly as needed to create a unit of actionable user behavior.
