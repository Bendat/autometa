# @autometa/jest-integration

## 0.4.15

### Patch Changes

- @autometa/runner@0.4.14
- @autometa/jest-transformer@0.1.86

## 0.4.14

### Patch Changes

- @autometa/runner@0.4.13
- @autometa/jest-transformer@0.1.85

## 0.4.13

### Patch Changes

- @autometa/runner@0.4.12
- @autometa/jest-transformer@0.1.84

## 0.4.12

### Patch Changes

- @autometa/runner@0.4.11
- @autometa/jest-transformer@0.1.83

## 0.4.11

### Patch Changes

- @autometa/runner@0.4.10
- @autometa/app@0.3.4
- @autometa/jest-transformer@0.1.82

## 0.4.10

### Patch Changes

- Updated dependencies [536004e]
- Updated dependencies [bac2661]
  - @autometa/app@0.3.3
  - @autometa/runner@0.4.9
  - @autometa/jest-transformer@0.1.81

## 0.4.9

### Patch Changes

- @autometa/runner@0.4.8
- @autometa/jest-transformer@0.1.80

## 0.4.8

### Patch Changes

- @autometa/runner@0.4.7
- @autometa/jest-transformer@0.1.79

## 0.4.7

### Patch Changes

- @autometa/runner@0.4.6
- @autometa/jest-transformer@0.1.78

## 0.4.6

### Patch Changes

- @autometa/runner@0.4.5
- @autometa/jest-transformer@0.1.77

## 0.4.5

### Patch Changes

- @autometa/runner@0.4.4
- @autometa/jest-transformer@0.1.76

## 0.4.4

### Patch Changes

- @autometa/runner@0.4.3
- @autometa/jest-transformer@0.1.75

## 0.4.3

### Patch Changes

- @autometa/runner@0.4.2
- @autometa/jest-transformer@0.1.74

## 0.4.2

### Patch Changes

- Updated dependencies [04c3aaf]
  - @autometa/runner@0.4.1
  - @autometa/jest-transformer@0.1.73

## 0.4.1

### Patch Changes

- Updated dependencies [7e9d2bc]
  - @autometa/runner@0.4.0
  - @autometa/jest-transformer@0.1.72

## 0.4.0

### Minor Changes

- 82168a2: fix: `onRecievedResponse` hook not running when response failed schema validation

  - Renamed hooks to `onSend` and `onRecieve`
  - Rewrote HTTP fixture logic to be constructable and derivable.
    - `new HTTP().sharedRoute('v1')` constructs a single instance of HTTP with route `v1`
    - `new HTTP().sharedRoute('v1').route('user') derives a new HTTP fixture which inherits 'v1' and adds 'user' locally.
  - Support for list based params with `paramList` and `sharedParamList`
  - Added default schemas for use with simple response types like null, boolean, number etc

### Patch Changes

- @autometa/runner@0.3.3
- @autometa/app@0.3.2
- @autometa/jest-transformer@0.1.71

## 0.3.2

### Patch Changes

- Updated dependencies [a833a27]
  - @autometa/runner@0.3.2
  - @autometa/jest-transformer@0.1.70

## 0.3.1

### Patch Changes

- Updated dependencies [6c4bb8d]
  - @autometa/runner@0.3.1
  - @autometa/app@0.3.1
  - @autometa/jest-transformer@0.1.69

## 0.3.0

### Minor Changes

- 98d911f: feat: replace tsyringe with custom DI solution

### Patch Changes

- Updated dependencies [98d911f]
  - @autometa/runner@0.3.0
  - @autometa/app@0.3.0
  - @autometa/jest-transformer@0.1.68

## 0.2.27

### Patch Changes

- @autometa/runner@0.2.59
- @autometa/jest-transformer@0.1.67

## 0.2.26

### Patch Changes

- @autometa/app@0.2.4
- @autometa/runner@0.2.58
- @autometa/jest-transformer@0.1.66

## 0.2.25

### Patch Changes

- @autometa/app@0.2.3
- @autometa/runner@0.2.57
- @autometa/jest-transformer@0.1.65

## 0.2.24

### Patch Changes

- Updated dependencies [e58c175]
  - @autometa/runner@0.2.56
  - @autometa/jest-transformer@0.1.64

## 0.2.23

### Patch Changes

- @autometa/runner@0.2.55
- @autometa/jest-transformer@0.1.63

## 0.2.22

### Patch Changes

- @autometa/runner@0.2.54
- @autometa/jest-transformer@0.1.62

## 0.2.21

### Patch Changes

- @autometa/runner@0.2.53
- @autometa/jest-transformer@0.1.61

## 0.2.20

### Patch Changes

- @autometa/runner@0.2.52
- @autometa/jest-transformer@0.1.60

## 0.2.19

### Patch Changes

- Updated dependencies [8ec0cdc]
  - @autometa/runner@0.2.51
  - @autometa/app@0.2.2
  - @autometa/jest-transformer@0.1.59

## 0.2.18

### Patch Changes

- @autometa/app@0.2.1
- @autometa/runner@0.2.50
- @autometa/jest-transformer@0.1.58

## 0.2.17

### Patch Changes

- Updated dependencies [6fe8f64]
  - @autometa/runner@0.2.49
  - @autometa/jest-transformer@0.1.57

## 0.2.16

### Patch Changes

- Updated dependencies [8f116d9]
  - @autometa/app@0.2.0
  - @autometa/runner@0.2.48
  - @autometa/jest-transformer@0.1.56

## 0.2.15

### Patch Changes

- @autometa/runner@0.2.47
- @autometa/jest-transformer@0.1.55

## 0.2.14

### Patch Changes

- @autometa/runner@0.2.46
- @autometa/jest-transformer@0.1.54

## 0.2.13

### Patch Changes

- @autometa/runner@0.2.45
- @autometa/jest-transformer@0.1.53

## 0.2.12

### Patch Changes

- @autometa/runner@0.2.44
- @autometa/jest-transformer@0.1.52

## 0.2.11

### Patch Changes

- @autometa/runner@0.2.43
- @autometa/jest-transformer@0.1.51

## 0.2.10

### Patch Changes

- @autometa/runner@0.2.42
- @autometa/jest-transformer@0.1.50

## 0.2.9

### Patch Changes

- @autometa/runner@0.2.41
- @autometa/jest-transformer@0.1.49

## 0.2.8

### Patch Changes

- @autometa/runner@0.2.40
- @autometa/jest-transformer@0.1.48

## 0.2.7

### Patch Changes

- @autometa/runner@0.2.39
- @autometa/jest-transformer@0.1.47

## 0.2.6

### Patch Changes

- @autometa/runner@0.2.38
- @autometa/jest-transformer@0.1.46

## 0.2.5

### Patch Changes

- Updated dependencies [8912822]
  - @autometa/runner@0.2.37
  - @autometa/jest-transformer@0.1.45

## 0.2.4

### Patch Changes

- @autometa/runner@0.2.36
- @autometa/jest-transformer@0.1.44

## 0.2.3

### Patch Changes

- @autometa/runner@0.2.35
- @autometa/jest-transformer@0.1.43

## 0.2.2

### Patch Changes

- @autometa/runner@0.2.34
- @autometa/jest-transformer@0.1.42

## 0.2.1

### Patch Changes

- 04ed85d: feat: added HTP client based on axios
- Updated dependencies [04ed85d]
  - @autometa/jest-transformer@0.1.41
  - @autometa/bind-decorator@0.5.1
  - @autometa/runner@0.2.33
  - @autometa/app@0.1.13

## 0.2.0

### Minor Changes

- de6dad7: Feat: Expressions are now loaded using config

### Patch Changes

- @autometa/runner@0.2.32
- @autometa/jest-transformer@0.1.40

## 0.1.39

### Patch Changes

- @autometa/runner@0.2.31
- @autometa/jest-transformer@0.1.39

## 0.1.38

### Patch Changes

- @autometa/runner@0.2.30
- @autometa/jest-transformer@0.1.38

## 0.1.37

### Patch Changes

- @autometa/runner@0.2.29
- @autometa/jest-transformer@0.1.37

## 0.1.36

### Patch Changes

- @autometa/runner@0.2.28
- @autometa/jest-transformer@0.1.36

## 0.1.35

### Patch Changes

- Updated dependencies [96d25f7]
  - @autometa/runner@0.2.27
  - @autometa/jest-transformer@0.1.35

## 0.1.34

### Patch Changes

- Updated dependencies [05597f0]
  - @autometa/runner@0.2.26
  - @autometa/jest-transformer@0.1.34

## 0.1.33

### Patch Changes

- Updated dependencies [4c0999a]
  - @autometa/runner@0.2.25
  - @autometa/jest-transformer@0.1.33

## 0.1.32

### Patch Changes

- @autometa/runner@0.2.24
- @autometa/jest-transformer@0.1.32

## 0.1.31

### Patch Changes

- Updated dependencies [4ee4e99]
  - @autometa/app@0.1.12
  - @autometa/runner@0.2.23
  - @autometa/jest-transformer@0.1.31

## 0.1.30

### Patch Changes

- @autometa/runner@0.2.22
- @autometa/jest-transformer@0.1.30

## 0.1.29

### Patch Changes

- Release Bump
- Updated dependencies
  - @autometa/jest-transformer@0.1.29
  - @autometa/runner@0.2.21
  - @autometa/app@0.1.11

## 0.1.28

### Patch Changes

- Updated dependencies [a289cabb]
  - @autometa/runner@0.2.20
  - @autometa/jest-transformer@0.1.28
  - @autometa/app@0.1.10

## 0.1.27

### Patch Changes

- fix: exporting event types
- Updated dependencies
  - @autometa/jest-transformer@0.1.27
  - @autometa/runner@0.2.19

## 0.1.26

### Patch Changes

- Updated dependencies [3672161c]
  - @autometa/runner@0.2.18
  - @autometa/jest-transformer@0.1.26

## 0.1.25

### Patch Changes

- @autometa/runner@0.2.17
- @autometa/jest-transformer@0.1.25

## 0.1.24

### Patch Changes

- Updated dependencies [5b44aa88]
  - @autometa/runner@0.2.16
  - @autometa/jest-transformer@0.1.24

## 0.1.23

### Patch Changes

- Updated dependencies [4af1139a]
  - @autometa/runner@0.2.15
  - @autometa/jest-transformer@0.1.23

## 0.1.22

### Patch Changes

- Updated dependencies [4bbb87e4]
  - @autometa/runner@0.2.14
  - @autometa/jest-transformer@0.1.22

## 0.1.21

### Patch Changes

- Updated dependencies [ddbdb401]
  - @autometa/app@0.1.9
  - @autometa/runner@0.2.13
  - @autometa/jest-transformer@0.1.21

## 0.1.20

### Patch Changes

- Updated dependencies [2cbc095e]
  - @autometa/runner@0.2.12
  - @autometa/jest-transformer@0.1.20

## 0.1.19

### Patch Changes

- 53f958e1: Fix: steps not executing onStepEnded event when an error was thrown
- Updated dependencies [53f958e1]
  - @autometa/app@0.1.8
  - @autometa/runner@0.2.11
  - @autometa/jest-transformer@0.1.19

## 0.1.18

### Patch Changes

- Fix: bad dist published
- Updated dependencies
  - @autometa/jest-transformer@0.1.18
  - @autometa/runner@0.2.10
  - @autometa/app@0.1.7

## 0.1.17

### Patch Changes

- Updated dependencies [f167963f]
  - @autometa/app@0.1.6
  - @autometa/runner@0.2.9
  - @autometa/jest-transformer@0.1.17

## 0.1.16

### Patch Changes

- 12bd4b1e: fix: hooks not handling errors correctly
- Updated dependencies [12bd4b1e]
- Updated dependencies [12bd4b1e]
  - @autometa/runner@0.2.8
  - @autometa/jest-transformer@0.1.16
  - @autometa/app@0.1.5

## 0.1.15

### Patch Changes

- Updated dependencies [ff45dc43]
  - @autometa/runner@0.2.7
  - @autometa/jest-transformer@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies [29ed7239]
  - @autometa/runner@0.2.6
  - @autometa/jest-transformer@0.1.14

## 0.1.13

### Patch Changes

- 4a16497d: fix(scopes): hooks not executing without tag expressions
- Updated dependencies [4a16497d]
  - @autometa/app@0.1.4
  - @autometa/runner@0.2.5
  - @autometa/jest-transformer@0.1.13

## 0.1.12

### Patch Changes

- Updated dependencies [90ac3d9c]
  - @autometa/runner@0.2.4
  - @autometa/jest-transformer@0.1.12

## 0.1.11

### Patch Changes

- e243e8b4: fix: globally scoped hooks not executing
- Updated dependencies [e243e8b4]
  - @autometa/runner@0.2.3
  - @autometa/jest-transformer@0.1.11

## 0.1.10

### Patch Changes

- @autometa/app@0.1.3
- @autometa/runner@0.2.2
- @autometa/jest-transformer@0.1.10

## 0.1.9

### Patch Changes

- 44307a8f: Fixed incorrect build published
- Updated dependencies [44307a8f]
  - @autometa/jest-transformer@0.1.9
  - @autometa/runner@0.2.1

## 0.1.8

### Patch Changes

- Updated dependencies [1d5f5ae3]
  - @autometa/runner@0.2.0
  - @autometa/jest-transformer@0.1.8

## 0.1.7

### Patch Changes

- Updated dependencies [020527bd]
  - @autometa/runner@0.1.7
  - @autometa/jest-transformer@0.1.7

## 0.1.6

### Patch Changes

- Updated dependencies [c7e2e26d]
  - @autometa/runner@0.1.6
  - @autometa/jest-transformer@0.1.6

## 0.1.5

### Patch Changes

- e8f02f3a: Small bug fixes, unit test coverage, tag expressions
- Updated dependencies [e8f02f3a]
- Updated dependencies [e8f02f3a]
  - @autometa/runner@0.1.5
  - @autometa/app@0.1.2
  - @autometa/jest-transformer@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [fa4401e]
  - @autometa/runner@0.1.4
  - @autometa/jest-transformer@0.1.4

## 0.1.3

### Patch Changes

- @autometa/runner@0.1.3
- @autometa/jest-transformer@0.1.3

## 0.1.2

### Patch Changes

- bf23fc4: small fixes and cleanup
  - @autometa/app@0.1.1
  - @autometa/runner@0.1.2
  - @autometa/jest-transformer@0.1.2

## 0.1.1

### Patch Changes

- 531b421: Fix for runner not publishing to NPM
- Updated dependencies [531b421]
  - @autometa/jest-transformer@0.1.1
  - @autometa/runner@0.1.1

## 0.1.0

### Minor Changes

- 554b77e: Releasing packages

### Patch Changes

- Updated dependencies [554b77e]
  - @autometa/bind-decorator@0.5.0
  - @autometa/app@0.1.0
  - @autometa/runner@0.1.0
  - @autometa/jest-transformer@0.1.0
