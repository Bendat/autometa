# Reusing Steps

It's possible to create Steps for reuse. To do so,
simple create a variable which provides a `ScenarioInnerCallback` function.

For example

```ts
import {ScenarioInnerCallback} from '@autometa/cucumber'

export const applyUserCredentials: ScenarioInnerCallback = (({Given, And}))=>{
    Given('the user has provided their username', ()=>....)
    And('the user has provided their password', ()=>....)
}

export const validateLoginSuccessful: ScenarioInnerCallback = (({Then, And})=>{
    Then('the users profile is visible', ()=>...)
    And('it shows their username', ()=>...)
})
```

Which can be called from your scenarios `Shared` function callback.

```ts
import {applyUserCredentials, validateLoginSuccessful} from '../shared'
....
Scenario(({When, Shared})=>{
    Shared(
        applyUserCredentials,
        validateLoginSuccessful
    );

    When('the user logs in', ()=>...)
})
....
```

... or to maintain structural consistency:

```ts
import {applyUserCredentials, validateLoginSuccessful} from '../shared'
....
Scenario(({When, Shared})=>{
    Shared(
        validateLoginSuccessful
    );

    When('the user logs in', ()=>...)

    Shared(
        validateLoginSuccessful
    );
})
....
```

To pass data to a shared step, wrap it in a function.

```ts
import {ScenarioInnerCallback} from '@autometa/cucumber'

export const applyUserCredentials: ScenarioInnerCallback = (userName: string)=>{
    return (({ Given, And }))=>{
        Given('the user has provided their username', ()=>{
            input.type(username)
        });

        And('the user has provided their password', ()=>....)
    }
}
```

And call it with the data

```ts
import {applyUserCredentials, validateLoginSuccessful} from '../shared'
....
Scenario(({When, Shared})=>{
    Shared(
        applyUserCredentials('barrybongo')
    );

    When('the user logs in', ()=>...)

    Shared(
        validateLoginSuccessful
    );
})
....
```
