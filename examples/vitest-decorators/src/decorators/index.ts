/**
 * Step Definition Decorators with DI Support
 * 
 * This module provides decorators for class-based step definitions with
 * dependency injection. It uses a global container pattern:
 * 
 * 1. Services are registered at module load via @Injectable()
 * 2. Step classes are registered via @Binding()
 * 3. At runtime, child containers are created per-scenario with WORLD_TOKEN
 * 4. Dependencies are injected via @Inject(token)
 * 
 * Example:
 * ```typescript
 * @Injectable()
 * class MyService { ... }
 * 
 * @Binding()
 * class MySteps {
 *   constructor(
 *     @Inject(WORLD_TOKEN) private world: MyWorld,
 *     @Inject(MyService) private service: MyService
 *   ) {}
 *   
 *   @Given("some step")
 *   myStep() { ... }
 * }
 * ```
 */
export {
  // Step decorators
  Binding,
  Given,
  When,
  Then,
  And,
  But,
  getBindingSteps,
  // DI decorators (bound to global container)
  Injectable,
  Inject,
  LazyInject,
  globalContainer,
  // Types
  type StepMethodMetadata,
  type BindingMetadata,
} from "./step-decorators";
