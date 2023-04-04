# Gherkin example

_This example is used for feature-to-md testing_

## **_Background_**: _setup_

_A Background Description_

### Steps

**_Given_** setup is set up

| Data Table |        |
| ---------- | ------ |
| data1      | data 2 |

**_And_** setup is set up

| Data Table |
| ---------- |
| data1      |

**_When_** anuther

```ts title='Doc String'
class Foo {}
```

**_Then_** a brother

```text title='Doc String'
I got my docstring
```

---

## **_Scenario_**: _A Scenario_

**Tags**: `@foo`
`@bar`
`@baz`

### Steps

**_Given_** a me, mario

**_When_** foo

---

## **_Scenario Outline_**: _Application should perform the requested function_

**Tags**: `@example`
`@scenario`

_This is a simple Scenario Outline example._

_Roight_

### Steps

**_Given_** the application is started

| Data Table |       |
| ---------- | ----- |
| name       | blame |
| grame      | shame |

**_And_** the inputs are provided

**_When_** the requested function is invoked with &lt;input&gt;

**_Then_** the result is &lt;output&gt;

### Examples:

_These are the basic examples_

**Tags**: `@foo`

| input | output  |
| ----- | ------- |
| one   | two     |
| two   | "three" |
| three | 7even   |

### Examples:

_These are the advanced examples_

**Tags**: `@bar`

| input | output |
| ----- | ------ |
| 4     | 5      |
| 6     | "7"    |
| 2     | 2      |

---

# **Rule**: A Rule

_,_

## **_Scenario_**: _A Scenario_

**Tags**: `@foo`
`@bar`
`@baz`

### Steps

**_Given_** a me, mario

**_When_** foo

---

## **_Scenario_**: _A Scenario_

**Tags**: `@foo`
`@bar`
`@baz`

### Steps

**_Given_** a me, mario

**_When_** foo

---
