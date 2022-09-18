# Autometa

_Autometa_ is intended to be an automation framework toolkit, which provides libraries to help automate the automation
process on node

Below is a summary of Autometa Libraries

## Page Component Model - Selenium

[Page Component Model](./ui-testing/selenium/page-component-model/intro) is a [Page Object Model](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/) library
that aims to simplify creating page objects by introducing the concept of components, in alignment with popular front end framework concepts.

The Page Component Model library allows page objects to be written declaratively, with minimal logic and zero instantiation. WebElements
are automatically picked and loaded based on statically defined information and reflection metadata. They are lazy (connect to selenium only when requested) and scoped (Components will always be located under their parent Components underlying WebElement, only using the WebDriver if the parent is a Page)
