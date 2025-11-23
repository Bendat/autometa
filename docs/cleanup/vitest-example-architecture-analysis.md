# Vitest Example Architecture Analysis

**Model**: Claude Sonnet 4.5  
**Date**: 23 November 2025  
**Purpose**: Comprehensive architectural review of the Autometa vitest-functions example to identify improvements and ensure alignment with framework capabilities

---

## Executive Summary

The vitest-functions example is a well-structured demonstration of the Autometa framework showcasing a "Brew Buddy" coffee shop API testing scenario. Overall, the example demonstrates solid architecture with good separation of concerns, effective use of dependency injection, and appropriate patterns. However, there are several opportunities to improve quality, leverage built-in framework features, and eliminate redundant custom implementations.

**Key Findings:**
- ✅ Strong: Composition root pattern, world inheritance, hook lifecycle tracking
- ⚠️ Moderate: Custom assertion helpers duplicate `@autometa/assertions` capabilities
- ⚠️ Moderate: Manual argument parsing pattern (`splitArguments`) is verbose and error-prone
- ⚠️ Moderate: Custom JSON path resolution when `@autometa/gherkin` may have table helpers
- ⚠️ Moderate: SSE implementation is simulated rather than demonstrating real streaming
- ✅ Strong: Good use of parameter types and custom cucumber expressions

---

## Architecture Review

### 1. World & State Management

**Current State**: ✅ Excellent

```typescript
// world.ts - Well-structured world object
export interface BrewBuddyWorldBase {
  baseUrl: string;
  lastResponse?: HTTPResponse<unknown>;
  readonly aliases: { /* ... */ };
  readonly scenario: ScenarioState;
  readonly lifecycle: LifecycleMetrics;
  readonly runtime: StepRuntimeHelpers;
  readonly ancestors?: readonly BrewBuddyWorldBase[];
}
```

**Strengths:**
- Uses `WORLD_INHERIT_KEYS` symbol correctly to define inherited properties
- Clear separation between base world and app-augmented world
- Readonly collections prevent accidental mutation
- Good use of TypeScript's type system for state modeling

**Recommendations:**
- ✅ No changes needed - this is exemplary implementation

---

### 2. Dependency Injection & Composition Root

**Current State**: ✅ Excellent

```typescript
// composition/brew-buddy-app.ts
export const CompositionRoot = App.compositionRoot<BrewBuddyWorldBase, BrewBuddyApp>(
  BrewBuddyApp,
  {
    deps: [HTTP_CLIENT, BrewBuddyMemoryService],
    setup: registerBrewBuddyServices,
    inject: {
      streamManager: BrewBuddyStreamManager,
      world: { token: WORLD_TOKEN },
    },
  }
);
```

**Strengths:**
- Proper use of tokens for DI
- Scoped services (Scenario scope for HTTP client, memory, stream manager)
- Clean separation of service registration from usage
- Good factory pattern for HTTP client

**Recommendations:**
- ✅ No changes needed - demonstrates best practices for Autometa's DI system

---

### 3. Assertions & Validation

**Current State**: ⚠️ Needs Improvement

The example implements custom assertion helpers that duplicate functionality already available in `@autometa/assertions`:

```typescript
// utils/assertions.ts - REDUNDANT IMPLEMENTATIONS
export function assertDefined<T>(value: T | null | undefined, message?: string): T { /* ... */ }
export function assertStrictEqual<T>(actual: T, expected: T, message?: string): void { /* ... */ }
export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void { /* ... */ }
export function assertGreaterThan(value: number, threshold: number, message?: string): void { /* ... */ }
export function assertCloseTo(actual: number, expected: number, precision = 2): void { /* ... */ }
```

**Problems:**
1. **Duplication**: `@autometa/assertions` already provides fluent matchers for all these cases
2. **Type Safety**: Custom assertions don't provide TypeScript narrowing like `ensure()` does
3. **Consistency**: Mixes custom assertions with framework's `ensure()` API
4. **Maintenance**: Custom code needs to be maintained alongside framework updates

**Framework Capabilities:**
```typescript
// @autometa/assertions provides:
ensure(value, { label: "..." })
  .toBeDefined()              // ✅ Instead of assertDefined
  .toStrictEqual(expected)    // ✅ Instead of assertStrictEqual  
  .toBeInstanceOf(Type)       // ✅ Type-safe narrowing
  .toBeObjectContaining({})   // ✅ Instead of assertDeepEqual
  .toBeGreaterThan(n)         // ✅ Instead of assertGreaterThan
  .toBeCloseTo(n, precision)  // ✅ Instead of assertCloseTo
```

**Recommendations:**

**Priority: HIGH** - Replace all custom assertions with `ensure()`:

```typescript
// BEFORE (custom)
assertDefined(item, `Menu item ${name} not found`);
assertCloseTo(item.price, expected.price, 2, `Price mismatch for ${name}`);

// AFTER (framework)
const item = ensure(world)(
  items.find(i => i.name === name),
  { label: `Menu item ${name} not found` }
).toBeDefined().value;

ensure(world)(item.price, { label: `Price for ${name}` })
  .toBeCloseTo(expected.price, 2);
```

**Benefits:**
- Eliminates ~150 lines of redundant code
- Provides TypeScript narrowing automatically
- Consistent API across all test scenarios
- Framework handles error formatting and messaging

---

### 4. Step Definition Patterns

**Current State**: ⚠️ Mixed Quality

#### 4.1 Manual Argument Parsing

The example uses a complex `splitArguments` pattern that's verbose and error-prone:

```typescript
// requests.ts - PROBLEMATIC PATTERN
function splitArguments(
  thisWorld: BrewBuddyWorld,
  args: readonly unknown[]
): { world: BrewBuddyWorld; expression: readonly unknown[] } {
  // 40+ lines of complex parsing logic
  // Handles both `this` context and trailing world parameter
  // Checks for StepRuntimeHelpers in arguments
}

Then("the response status should be {int}", function (this: BrewBuddyWorld, ...args: unknown[]) {
  const { world, expression } = splitArguments(this, args);
  const [status] = expression;
  // ...
});
```

**Problems:**
1. **Complexity**: Unnecessary complexity for what the framework already handles
2. **Runtime Overhead**: Parsing arguments on every step execution
3. **Type Safety Lost**: `unknown[]` loses TypeScript's parameter inference
4. **Inconsistency**: Not all steps use this pattern

**Better Approach:**

The framework injects world automatically when needed. Choose ONE consistent pattern:

```typescript
// OPTION A: World parameter (recommended for this example)
Then("the response status should be {int}", (status: number, world: BrewBuddyWorld) => {
  ensure(world).response.hasStatus(status);
});

// OPTION B: this context (if needed for specific scenarios)
Then("the response status should be {int}", function (this: BrewBuddyWorld, status: number) {
  ensure(this).response.hasStatus(status);
});
```

**Recommendations:**

**Priority: HIGH** - Standardize on world parameter pattern:

1. Remove `splitArguments` utility entirely
2. Update all steps to use consistent `(params..., world: BrewBuddyWorld)` signature
3. Update documentation to show recommended pattern
4. Remove runtime helpers checking (framework handles this automatically)

**Example Refactor:**

```typescript
// BEFORE
Then("the response json should contain", function (this: BrewBuddyWorld, ...args: unknown[]) {
  const { world } = splitArguments(this, args);
  const table = world.runtime.requireTable("horizontal");
  const expectations = toPathExpectations(table.records());
  ensure(world).json.contains(expectations);
});

// AFTER
Then("the response json should contain", (world: BrewBuddyWorld) => {
  const table = world.runtime.requireTable("horizontal");
  const expectations = toPathExpectations(table.records());
  ensure(world).json.contains(expectations);
});
```

---

### 5. JSON Path Resolution

**Current State**: ⚠️ Potentially Redundant

The example implements custom JSON path resolution:

```typescript
// utils/json.ts
export function resolveJsonPath(source: unknown, path: string): unknown {
  const segments = splitPath(path); // Handles bracket notation
  // Manual traversal logic
}

export function coercePrimitive(value: string): unknown {
  // Handles booleans, numbers, null, JSON parsing
}
```

**Questions to Validate:**

1. Does `@autometa/gherkin` table utilities already handle type coercion?
2. Is there a standard JSON path library that could be used?
3. Could the assertion plugin system handle path resolution more elegantly?

**Recommendation:**

**Priority: MEDIUM** - Investigate before refactoring:

1. Check if `@autometa/gherkin`'s `TableRecord` type resolution already handles coercion
2. Consider using a battle-tested library like `jsonpath-plus` if custom logic is needed
3. If custom implementation is required, document WHY in code comments

**Current usage suggests this might be framework material:**
```typescript
// If this pattern is common across multiple examples, consider:
// 1. Adding to @autometa/assertions as a JSON path matcher
// 2. Adding to @autometa/gherkin as table utility
// 3. Creating @autometa/json-path package
```

---

### 6. HTTP Client Abstraction

**Current State**: ✅ Good, with minor improvements possible

```typescript
// utils/http.ts
export class BrewBuddyApp {
  readonly http: HTTP;
  readonly memory: BrewBuddyMemoryService;
  
  request(method: HttpMethodInput, path: string, options: RequestOptions = {}) {
    const segments = normalisePath(path);
    const client = this.http
      .route(...segments)
      .headers(options.headers ?? {})
      .params(options.query ?? {})
      .data(options.body);
    return dispatch(client, method);
  }
}
```

**Strengths:**
- Clean wrapper around `@autometa/http`
- Good separation of concerns
- Proper error handling with `HTTPError`

**Minor Improvements:**

```typescript
// Consider exposing HTTP builder for advanced scenarios
public builder(path: string): HTTP {
  return this.http.route(...normalisePath(path));
}

// Then steps can use:
When("I send a complex request", async (world) => {
  await world.app.builder("/orders")
    .header("X-Custom", "value")
    .retry(config => config.maxAttempts(3))
    .timeout(5000)
    .post();
});
```

**Recommendation:**
**Priority: LOW** - Current implementation is fine; enhancement is optional

---

### 7. SSE/Streaming Implementation

**Current State**: ⚠️ Simulated, Not Real

```typescript
// streaming.ts - SIMULATED EVENTS
When("the kitchen updates the order status sequence", function (this: BrewBuddyWorld) {
  // Manually creates simulatedEvents array
  // Doesn't actually connect to SSE endpoint
  this.scenario.simulatedEvents.push({ event: status, data: { status } });
});
```

**Problems:**
1. **Not Representative**: Doesn't demonstrate actual SSE connection behavior
2. **Missing Coverage**: `@autometa/http` has streaming support that's not showcased
3. **Confusing**: Readers might think this is how to handle SSE

**Framework Capabilities:**

```typescript
// @autometa/http supports streaming:
const stream = await http()
  .get("/events")
  .stream()
  .execute();

for await (const chunk of stream.body) {
  // Process real SSE events
}
```

**Recommendations:**

**Priority: MEDIUM** - Either remove or make real:

**Option A**: Remove streaming scenarios entirely if Brew Buddy API doesn't support SSE
- Focus example on what's actually testable
- Add a separate SSE example with a real streaming API

**Option B**: Implement real SSE support in Brew Buddy API
- Update `.api` to emit actual SSE events for order status
- Use real connection in steps
- Demonstrate `@autometa/http` streaming capabilities

**Option C**: Clearly document as simulation
- Add comment explaining this is a simulation for demonstration
- Reference real SSE examples elsewhere

---

### 8. Parameter Types & Custom Expressions

**Current State**: ✅ Excellent

```typescript
// support/parameter-types.ts
defineParameterType({
  name: "httpMethod",
  pattern: HTTP_METHOD_VARIANTS,
  transform: (method: unknown): HttpMethod => String(method).toUpperCase() as HttpMethod,
});

defineParameterType({
  name: "menuSelection",
  pattern: SELECTION_VARIANTS,
  transform: (value: unknown, context: ParameterTransformContext<BrewBuddyWorld>): MenuExpectation => {
    // Uses world context for validation
    const activeRegion = context.world.scenario.region;
    // ...
  },
});
```

**Strengths:**
- Demonstrates custom parameter types effectively
- Uses world context in transformers
- Good validation and error messages
- Case-insensitive pattern generation utility

**Recommendations:**
- ✅ No changes needed - excellent example of custom expressions

---

### 9. Table Handling

**Current State**: ✅ Good usage of framework features

```typescript
// Examples of table usage patterns
const table = world.runtime.requireTable("horizontal");
const records = table.records<Recipe>();

const table = world.runtime.requireTable("vertical");
const data = table.getRecord(0) as { "coffee grams": number };

const items = table.asInstances(InventoryRow, {
  headerMap: { Item: "item", Quantity: "quantity" },
});
```

**Strengths:**
- Demonstrates multiple table shapes (horizontal, vertical)
- Shows `asInstances` for class materialization
- Uses type-safe record access

**Minor Enhancement Opportunity:**

```typescript
// Could demonstrate more of @autometa/gherkin table features:
import { createTable } from "@autometa/gherkin";

// Show custom transformers
const table = createTable(rawTable, {
  shape: "horizontal",
  transformers: {
    quantity: (val) => parseInt(val, 10),
    price: (val) => parseFloat(val),
  },
});
```

**Recommendation:**
**Priority: LOW** - Consider showcasing additional table features

---

### 10. Memory Service Pattern

**Current State**: ✅ Good, but could be more feature-rich

```typescript
// utils/memory.ts
export class BrewBuddyMemoryService {
  private world!: BrewBuddyWorldBase;
  
  rememberMenuSnapshot(items: MenuItem[]): void {
    this.state.scenario.menuSnapshot = items;
  }
  
  rememberOrder(order: Order): void {
    this.state.scenario.order = order;
    this.state.aliases.orders.set(order.ticket, order);
  }
}
```

**Strengths:**
- Good abstraction for world state management
- DI-friendly design
- Clear intent with method names

**Enhancement Opportunity:**

The memory service could demonstrate more advanced patterns:

```typescript
// Could show cache invalidation
clearMenuCache(): void {
  this.state.scenario.menuSnapshot = undefined;
}

// Could show computed properties
getOrdersByStatus(status: string): Order[] {
  return Array.from(this.state.aliases.orders.values())
    .filter(o => o.status === status);
}

// Could demonstrate snapshot comparison
hasMenuChanged(): boolean {
  const current = this.state.scenario.menuSnapshot;
  const initial = this.state.scenario.initialMenuSnapshot;
  return !isDeepStrictEqual(current, initial);
}
```

**Recommendation:**
**Priority: LOW** - Current implementation is fine; enhancements are optional to show advanced patterns

---

### 11. Hook Lifecycle Tracking

**Current State**: ✅ Excellent

```typescript
// step-definitions.ts
BeforeFeature(({ world, scope, log }) => {
  world.lifecycle.featureName = scope.name;
  world.lifecycle.beforeFeatureRuns += 1;
  writeLifecycleLog(log, `Preparing "${scope.name}"`);
});

AfterStep(({ world, scope, metadata, log }) => {
  const details = (metadata ?? {}) as HookMetadata;
  const entry: LifecycleStepRecord = {
    scenario: scenarioName,
    step: label,
    status: (step.status as StepLifecycleStatus | undefined) ?? "passed",
  };
  world.lifecycle.stepHistory.push(entry);
});
```

**Strengths:**
- Demonstrates comprehensive hook usage
- Shows metadata access pattern
- Good logging practices
- Validates hook execution in tests

**Recommendations:**
- ✅ No changes needed - exemplary demonstration of hook system

---

### 12. Documentation & Comments

**Current State**: ⚠️ Sparse

The code is generally well-structured but lacks explanatory comments, especially for:
- Custom patterns and why they exist
- Framework feature demonstrations
- Learning objectives for each section

**Recommendations:**

**Priority: MEDIUM** - Add educational comments:

```typescript
// Example of helpful documentation:

/**
 * Demonstrates Autometa's custom parameter type system.
 * 
 * This parameter type shows:
 * 1. Case-insensitive pattern matching
 * 2. Using world context in transformers
 * 3. Cross-validation between related parameters
 * 
 * @see https://autometa.dev/docs/parameter-types
 */
defineParameterType({
  name: "menuSelection",
  // ...
});

/**
 * Composition root for BrewBuddy example.
 * 
 * Demonstrates:
 * - Service registration with scoping
 * - Token-based DI
 * - App factory pattern
 * - Lazy injection of world context
 */
export const CompositionRoot = App.compositionRoot<BrewBuddyWorldBase, BrewBuddyApp>(
  // ...
);
```

---

## Testing the API (Not Covered in Detail)

**Note**: This analysis focused on the example test code. The actual Brew Buddy API in `examples/.api` was not deeply reviewed, but should be examined separately to ensure:

1. It's a realistic example API (not over-simplified)
2. It properly demonstrates error scenarios
3. It has adequate documentation
4. It's easy to run and understand

---

## Priority Action Items

### High Priority

1. **Replace Custom Assertions** (Est: 4-6 hours)
   - Remove custom assertion helpers from `utils/assertions.ts`
   - Update all usages to `ensure()` API
   - Add examples demonstrating `ensure()` type narrowing
   - Update documentation

2. **Standardize Step Signatures** (Est: 3-4 hours)
   - Remove `splitArguments` utility
   - Refactor all steps to consistent world parameter pattern
   - Update documentation to show recommended pattern

3. **Document Framework Features** (Est: 2-3 hours)
   - Add JSDoc comments explaining what each section demonstrates
   - Link to relevant framework documentation
   - Add learning objectives to README

### Medium Priority

4. **SSE Streaming Decision** (Est: 4-8 hours depending on approach)
   - Decide on approach (remove, implement, or document as simulation)
   - Update implementation accordingly
   - Add clear documentation

5. **Review JSON Path Implementation** (Est: 2-3 hours)
   - Investigate if framework provides equivalent
   - Document rationale if custom code is needed
   - Consider extracting to separate package if reusable

6. **Educational Comments** (Est: 2-3 hours)
   - Add comments explaining patterns
   - Document why certain approaches were chosen
   - Add links to framework docs

### Low Priority

7. **Table Feature Showcase** (Est: 1-2 hours)
   - Add example showing custom transformers
   - Demonstrate additional table shapes
   - Show more advanced table patterns

8. **Memory Service Enhancement** (Est: 2-3 hours)
   - Add methods showing cache invalidation
   - Demonstrate computed properties
   - Show snapshot comparison patterns

9. **HTTP Client Enhancement** (Est: 1-2 hours)
   - Add builder method for advanced scenarios
   - Demonstrate retry configuration
   - Show timeout handling

---

## Feature Coverage Matrix

| Framework Feature | Currently Demonstrated | Quality | Notes |
|------------------|------------------------|---------|-------|
| World Inheritance | ✅ Yes | Excellent | Uses `WORLD_INHERIT_KEYS` correctly |
| Composition Root | ✅ Yes | Excellent | Clean DI setup with tokens |
| Custom Parameter Types | ✅ Yes | Excellent | Multiple examples with validation |
| Assertion Plugins | ✅ Yes | Good | Response and JSON plugins |
| HTTP Client | ✅ Yes | Good | Basic usage, could show more features |
| Table Handling | ✅ Yes | Good | Multiple shapes demonstrated |
| Hook Lifecycle | ✅ Yes | Excellent | Comprehensive coverage |
| Step Runtime Helpers | ✅ Yes | Good | Tables and docstrings |
| Dependency Injection | ✅ Yes | Excellent | Proper scoping and tokens |
| Streaming/SSE | ⚠️ Simulated | Poor | Not real implementation |
| Error Handling | ✅ Yes | Good | HTTP errors handled |
| Type Safety | ⚠️ Mixed | Mixed | Lost in splitArguments pattern |
| Datetime Utilities | ❌ No | N/A | Could add scheduling scenarios |
| DTO Builder | ❌ No | N/A | Could show payload building |

---

## Questions for Discussion

Before implementing changes, please clarify:

1. **SSE Streaming**: What's the intended approach? Should we:
   - Implement real SSE in Brew Buddy API?
   - Remove streaming scenarios entirely?
   - Keep as simulation but document clearly?

2. **JSON Path**: Should this be:
   - Extracted to a framework utility?
   - Replaced with existing library?
   - Kept as example-specific code?

3. **Custom Assertions**: Can we deprecate these immediately, or is there a migration concern?

4. **Example Scope**: Should we add demonstrations of:
   - `@autometa/datetime` for scheduling scenarios?
   - `@autometa/dto-builder` for complex payload construction?
   - More advanced HTTP features (retries, timeouts, cancellation)?

5. **Documentation Strategy**: Should examples have:
   - Inline JSDoc comments?
   - Separate tutorial markdown files?
   - Both?

---

## Conclusion

The vitest-functions example is a solid demonstration of Autometa's capabilities with good architectural patterns. The main areas for improvement are:

1. **Eliminating redundant code** that duplicates framework features
2. **Simplifying patterns** that add unnecessary complexity
3. **Improving documentation** to make learning objectives clear
4. **Addressing simulation vs. reality** in streaming scenarios

With these improvements, this example will serve as an excellent reference for teams adopting Autometa, clearly demonstrating best practices and framework capabilities.

---

## Estimated Effort

- **High Priority Items**: 9-13 hours
- **Medium Priority Items**: 8-14 hours  
- **Low Priority Items**: 4-7 hours
- **Total**: 21-34 hours

Recommend tackling high priority items first, as they provide the most value and eliminate technical debt.
