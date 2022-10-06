# Plans - Composing Behaviors

Using behaviors directly in tests is perfectly fine and may be sufficient.
For larger products there may be a desire to further compose behaviors which
are repeated across tests.

This can be accomplished with `Plans`. Plans are intended to describe
exactly what a user will do step by step. Tests then chain these steps together
in the order they need.

Steps do not accept parameters. They do exactly one job (which can be a complex job).

Plans are attached to a user to execute, and should be appropriate to the user role that will use them.

## Creating a Plan

A plan is a class which extends `Plans` and defines uninitialized properties of
type `stepOf<MyPlans>`. Step actions can be defined with the `@action` and `@observation` decorators. These decorators accept actions and observations
the same way that a user does.

```ts
type JohnnyStep = StepOf<JohnnyPlans>;

export class CustomerPlans extends Plans {
  @action(loginAs(myEnv.customer), DismissWelcomeBanner)
  toLoginWithCredentials: JohnnyStep;

  @action(SearchFor(myEnv.widgetName))
  toSearchForWidget: JohnnyStep;

  @action(FindCheapestWidget, AddCurrentItemToBasket, ReturnToSearch)
  toAddCheapestWidgetToBasket: JohnnyStep;

  @action(PurchaseItemsInBasket)
  toPurchaseItem: JohnnyStep;

  @see(ConfirmationBannerMessage, Is('Thanks for your order!'))
  toConfirmPurchase:
}
```

To begin using Plans in a test, we must first configure our users with them
by using the `@page` decorator, and updating our `User` to a `User<JohnnyPlans>`

```ts
@driver(myWebDriverBuilder)
export class Users extends Community {
  @role('Registered User')
  @browses(envUrls.productUrl)
  @plans(JohnnyPlans)
  Johnny: User>JohnnyPlans>;

  @role('Product Admin')
  @browses(envUrls.adminPortalUrl)
  Jenny: User;
}
```

Plans are accessed by a user through their `plans` property and must eventually be `await`d before they execute.

```ts
await Johnny.plans
  .toLoginWithCredentials()
  .toSearchForWidget()
  .toAddCheapestWidgetToBasket()
  .toPurchaseItem()
  .toConfirmPurchase();
```

It may be necessary for a plan to test the same flow multiple ways. For example, if our
customer may be used to test various login flows:

```ts
export class CustomerPlans extends Plans {
  @action(loginAs(myEnv.customer), DismissWelcomeBanner)
  toLoginWithCredentials: JohnnyStep;

  @action(loginAs(myEnv.noUsername))
  toLoginWithoutUsername: JohnnyStep;

  @action(loginAs(myEnv.noPassword))
  toLoginWithoutPassword: JohnnyStep;

  @action(loginAs(undefined))
  toLoginWithoutCredentials: JohnnyStep;
}
```

To avoid cluttering a plan, Plans can also be composed together. Here we can produce a LoginPlan for our customer:

```ts
export class CustomerLoginPlans extends Plans {
  @action(loginAs(myEnv.customer), DismissWelcomeBanner)
  toLoginWithCredentials: JohnnyStep;

  @action(loginAs(myEnv.noUsername))
  toLoginWithoutUsername: JohnnyStep;

  @action(loginAs(myEnv.noPassword))
  toLoginWithoutPassword: JohnnyStep;

  @action(loginAs(undefined))
  toLoginWithoutCredentials: JohnnyStep;
}
```

These can be tested in isolation, or they can be added to a larger plan.
There are two ways to use one plan from another.

### Composed Plans

Composed plans use the `@compose` decorator to add the subplan as a property:

```ts
export class CustomerPlans extends Plans {
  @compose(CustomerLoginPlans)
  withLogin: CustomerLoginPlans;

  @action(SearchFor(myEnv.widgetName))
  toSearchForWidget: JohnnyStep;

  @action(FindCheapestWidget, AddCurrentItemToBasket, ReturnToSearch)
  toAddCheapestWidgetToBasket: JohnnyStep;

  @action(PurchaseItemsInBasket)
  toPurchaseItem: JohnnyStep;

  @see(ConfirmationBannerMessage, Is('Thanks for your order!'))
  toConfirmPurchase: JohnnyStep;
}
```

Composed properties will typically be prefixed with `with` and can be stepped into during the test:

```ts
await Johnny.plans.withLogin.toLoginWithCredentials();
```

However the test is now within the context of the `CustomerLoginPlans` subplan. To escape to the
previous context, the `recompose` property can be used. For more deeply composed plans, the alias `andAgain` is available

```ts
await Johnny.plans.withLogin
  .toLoginWithCredentials()
  .recompose.toSearchForWidget();

await Johnny.plans.withSubPlan.withDeeperSubplan
  .toDoAction()
  .recompose.andAgain.toDoRootPlanAction();
```

### Procedures

Plans can also be combined with a `ProcedureOf<CustomerPlans, CustomerLoginPlans>` using the `@procedure` decorator.

```ts
export class CustomerPlans extends Plans {
  @procedure(CustomerLoginPlans)
  withLogin: ProcedureOf<CustomerPlans, CustomerLoginPlans>;

  // etc
}
```

Procedures are a function which accepts a callback function, providing the composed plan
as the first parameter. Once the procedure is completed, context is immediately returned
to the parent user. Procedure can be nested (but probably shouldn't)

```ts
await Johnny.plans
  .withLogin((plans) => plans.toLoginWithCredentials())
  .toSearchForWidget();
```

## Subplots

Plans support subplots through another users plans via the `triggers` method.

```ts
const {Johnny, Jenny} = Community.of(Users).following('Johnny')
await Johnny.plans.toBookSession().triggers(
    Tab('admin', New),
    Jenny.plans.confirmLatestBooking(),
    Which(SwitchesTo, 'initial)
)
```
