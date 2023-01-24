# Tags & Filtering Tests

In cucumber it's possible to tag your tests to categorize them. These tags can be used to filter scenarios which can or cannot run.

```title="Tags Query"
@web and not @mobile
```

When applied to the following feature file, only the first test will run

```gherkin
Feature: Some Feature
    @web
    Scenario: A scenario we only care about on web
        Given .....

    @mobile
    Scenario: A scenario we only care about on mobile
        Given ...

```

To apply a filter to a test, add it as the environment variable `CUCUMBER_FILTER`

```bash title="In Shell/Terminal"
export CUCUMBER_FILTER="@web and not @mobile"
```

```cmd title="In Powershell"
$env:CUCUMBER_FILTER = "@web and not @mobile"
```

```ini title="In .env file"
CUCUMBER_FILTER="@web and not @mobile"
```
