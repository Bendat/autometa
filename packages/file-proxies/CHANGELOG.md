# @autometa/file-proxies

## 0.2.0

### Minor Changes

- dfd1f81: feat: support arrays and nested objects in file object proxy

## 0.1.0

### Minor Changes

- 82168a2: fix: `onRecievedResponse` hook not running when response failed schema validation

  - Renamed hooks to `onSend` and `onRecieve`
  - Rewrote HTTP fixture logic to be constructable and derivable.
    - `new HTTP().sharedRoute('v1')` constructs a single instance of HTTP with route `v1`
    - `new HTTP().sharedRoute('v1').route('user') derives a new HTTP fixture which inherits 'v1' and adds 'user' locally.
  - Support for list based params with `paramList` and `sharedParamList`
  - Added default schemas for use with simple response types like null, boolean, number etc
