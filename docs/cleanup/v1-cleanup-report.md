# Autometa V1 Cleanup & Improvement Report

**Model:** Gemini 3 Pro (Preview)
**Date:** 23 November 2025

## Overview

This report outlines findings and actionable improvements for the `examples/vitest-functions` project and the core `packages/` of the Autometa framework. The goal is to elevate the quality of the example project to serve as a best-practice reference and to identify areas in the core libraries that can be optimized or better utilized.

## `examples/vitest-functions` Improvements

The `vitest-functions` example demonstrates the core capabilities of Autometa but suffers from verbose manual validation, redundant helper logic, and some architectural patterns that could be modernized.

### 1. Data Validation & Type Safety
**Current State:**
- API responses are validated using manual type guards and parsing functions (e.g., `isOrder`, `parseOrder`, `parseLoyalty` in `orders.ts`).
- This approach is verbose, error-prone, and hard to maintain.

**Recommendation:**
- **Adopt a Schema Validation Library:** Integrate `zod` (or similar) to define schemas for API responses. This will allow for runtime validation with inferred TypeScript types, significantly reducing boilerplate code.
- **Example:**
  ```typescript
  import { z } from "zod";
  
  const OrderSchema = z.object({
    ticket: z.string(),
    items: z.array(OrderItemSchema),
    // ...
  });
  
  // In step definition
  const order = OrderSchema.parse(world.lastResponseBody);
  ```

### 2. Test Data Construction
**Current State:**
- Test data (like `OrderInput`, `PaymentDetails`) is constructed using manual helper functions (`buildOrderItem`, `buildPaymentDetails`) that parse data tables.

**Recommendation:**
- **Utilize `@autometa/dto-builder`:** Showcase the framework's own `dto-builder` package to construct complex objects. This promotes the "Builder" pattern and demonstrates a key feature of the ecosystem.
- **Refactor Helpers:** Replace manual object literal construction with builder instances.

### 3. API Interaction & State Management
**Current State:**
- API calls are handled by a global-like `performRequest` helper function that manually mutates `world.lastResponse`, `world.lastError`, etc.
- `BrewBuddyApp` exists but is underutilized in the step definitions.

**Recommendation:**
- **Encapsulate API Logic:** Move the `performRequest` logic into a dedicated service (e.g., `BrewBuddyClient`) that is injected into the World or Steps.
- **Service-Based State:** The `BrewBuddyClient` should manage the "last response" state internally or expose it via a clean API, rather than steps manually manipulating the World object's properties.

### 4. Step Definitions & Lifecycle
**Current State:**
- `step-definitions.ts` contains custom logging logic for lifecycle events (`BeforeFeature`, `AfterStep`, etc.).
- `HookMetadata` is defined locally because it is not exported from the runner package.

**Recommendation:**
- **Remove Custom Logging:** Rely on Autometa's built-in reporters for lifecycle logging. If custom output is needed, implement a custom Reporter instead of cluttering step definitions.
- **Export `HookMetadata`:** Update `@autometa/runner` to export `HookMetadata` so it can be imported in consumer projects.

### 5. Configuration & Constants
**Current State:**
- API paths and error messages are hardcoded strings scattered throughout the steps.

**Recommendation:**
- **Centralize Constants:** Move API endpoints and expected error messages to a `constants.ts` file or a configuration object.

## `packages/` Improvements

### 1. `@autometa/runner`
- **Export Missing Types:** The `HookMetadata` interface is used in internal decorators but not exported. It should be part of the public API to allow users to type their hooks correctly.
- **Data Table Transformation:** If not already present, consider adding first-class support for transforming Gherkin Data Tables into typed objects (using `zod` schemas or class-transformer) to remove the need for manual parsing helpers like `readOrderOverrides`.

### 2. `@autometa/http`
- **Context/Session Management:** The "Last Response" pattern is ubiquitous in API testing. Consider adding a `HTTPSession` or `HTTPContext` utility that automatically tracks the last request and response, simplifying the "World" setup for users.
- **Dynamic Dispatch:** The `dispatch` function in the example manually switches on method strings. Ensure `HTTP` client supports a dynamic `request(method, url, ...)` API to avoid this switch statement.

### 3. `@autometa/dto-builder`
- **Integration:** Ensure this package is highlighted in the examples. It is a valuable tool for test data generation that is currently missing from the showcase.

## Action Plan

1.  **Refactor Example:**
    - Install `zod`.
    - Rewrite `orders.ts` and `common.ts` to use Zod schemas for validation.
    - Implement `dto-builder` for creating order and payment objects.
    - Refactor `performRequest` into a proper service class.
2.  **Update Packages:**
    - Export `HookMetadata` from `@autometa/runner`.
3.  **Cleanup:**
    - Remove manual logging from `step-definitions.ts`.
    - Centralize hardcoded strings.

This cleanup will result in a much more professional, maintainable, and impressive demonstration of the Autometa framework.
