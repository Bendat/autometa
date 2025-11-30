/**
 * Step definitions barrel export.
 * Import step classes here to ensure they're loaded and registered.
 * 
 * IMPORTANT: Step-definitions must be imported first to ensure the
 * runner is built and decorators are available before step classes
 * attempt to use them.
 */

// Ensure step-definitions is fully initialized first
import "../step-definitions";

// Import all step classes - this triggers their @Binding() decorators
import "./common.steps";
import "./menu.steps";
import "./orders.steps";
import "./requests.steps";
import "./recipes.steps";
import "./streaming.steps";
import "./tags.steps";
import "./lifecycle.steps";
import "./table-examples.steps";

// Re-export step definitions from the main setup
export * from "../step-definitions";
