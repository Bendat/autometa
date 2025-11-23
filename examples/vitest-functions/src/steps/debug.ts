import type { SourceRef } from "@autometa/scopes";

import { Then } from "../step-definitions";

Then("I log the current step metadata", (world) => {
  const metadata = world.runtime.currentStep;
  if (!metadata) {
    console.info("[autometa:step] No metadata captured for the current step.");
    return;
  }

  const lines: string[] = [];

  if (metadata.feature) {
    lines.push(
      formatHeading(
        "Feature",
        metadata.feature.keyword,
        metadata.feature.name,
        metadata.feature.source,
        metadata.feature.uri
      )
    );
  }

  if (metadata.scenario) {
    lines.push(
      formatHeading(
        "Scenario",
        metadata.scenario.keyword,
        metadata.scenario.name,
        metadata.scenario.source
      )
    );
  }

  if (metadata.outline) {
    lines.push(
      formatHeading(
        "Outline",
        metadata.outline.keyword,
        metadata.outline.name,
        metadata.outline.source
      )
    );
  }

  if (metadata.example) {
    const exampleLabel = metadata.example.name
      ? `${metadata.example.name} (#${metadata.example.index + 1})`
      : `#${metadata.example.index + 1}`;
    const entries = Object.entries(metadata.example.values)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
    lines.push(
      `Example ${exampleLabel}${formatSource(metadata.example.source)}${
        entries ? ` :: ${entries}` : ""
      }`
    );
  }

  if (metadata.step) {
    const keyword = metadata.step.keyword ? `${metadata.step.keyword} ` : "";
    lines.push(
      `Step: ${keyword}${metadata.step.text ?? "<unnamed>"}${formatSource(metadata.step.source)}`
    );
  }

  if (metadata.definition) {
    const expression =
      typeof metadata.definition.expression === "string"
        ? metadata.definition.expression
        : metadata.definition.expression.toString();
    lines.push(
      `Definition: ${metadata.definition.keyword} ${expression}${formatSource(metadata.definition.source)}`
    );
  }

  console.info(lines.join("\n"));
});

function formatHeading(
  label: string,
  keyword: string,
  name: string | undefined,
  source?: SourceRef,
  fallbackFile?: string
): string {
  const title = name ? `${keyword}: ${name}` : keyword;
  return `${label}: ${title}${formatSource(source, fallbackFile)}`;
}

function formatSource(source?: SourceRef, fallbackFile?: string): string {
  if (!source && !fallbackFile) {
    return "";
  }
  const file = source?.file ?? fallbackFile;
  const line = source?.line;
  const column = source?.column;
  if (file && line !== undefined) {
    return column !== undefined ? ` (${file}:${line}:${column})` : ` (${file}:${line})`;
  }
  if (file) {
    return ` (${file})`;
  }
  if (line !== undefined) {
    return column !== undefined ? ` (line ${line}:${column})` : ` (line ${line})`;
  }
  return "";
}
