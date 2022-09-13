# Documented Interfaces

Documented interfaces are interfaces which represent actions on the WebElement that Components do not
expose by default but may wish to expose, such as `click` for a button.

The methods on Documented Interfaces are documented, and that documentation can be inherited.

## Clickable
Exposes: 
- _`click()`_ on WebElement
- _`_click()`_ in WebComponent

Provides documentation for the 'click' method

## Readable
Exposes:
- _`text()`_ on WebElement
- _`_text`_ in WebComponent

Provides documentation for the `text` getter

## Clearable
Exposes:
- _`clear()`_ on WebElement
- _`_clear()`_ in WebComponent

Provides documentation for the `clear` method

## Writeable

Exposes:
- _`sendKeys()`_ on WebElement
- _`write()`_ in WebComponent
Provides documentation for the `write` method

## Submittable

Exposes:
- _`submit()`_ on WebElement
- _`_submit()`_ in WebComponent
Provides documentation for the `write` method