/**
 * Step definitions barrel export.
 * Import step classes here to ensure they're loaded and registered.
 */

// Import all step classes - this triggers their @Binding() decorators
import "./arithmetic.steps";

// Re-export step definitions from the main setup
export * from "../step-definitions";
