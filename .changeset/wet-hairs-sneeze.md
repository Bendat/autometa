---
"@autometa/jest-integration": minor
"@autometa/documentation": minor
"@autometa/file-proxies": minor
"@autometa/http": minor
---

fix: `onRecievedResponse` hook not running when response failed schema validation

- Renamed hooks to `onSend` and `onRecieve`
- Rewrote HTTP fixture logic to be constructable and derivable.
  - `new HTTP().sharedRoute('v1')` constructs a single instance of HTTP with route `v1`
  - `new HTTP().sharedRoute('v1').route('user') derives a new HTTP fixture which inherits 'v1' and adds 'user' locally.
- Support for list based params with `paramList` and `sharedParamList`
- Added default schemas for use with simple response types like null, boolean, number etc
