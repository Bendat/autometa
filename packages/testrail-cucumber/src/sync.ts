import pc from "picocolors";

import type { ParsedFeature, FeatureChildNode, ScenarioNode, ScenarioOutlineNode } from "./types";
import type { DuplicatePolicy } from "./duplicate-policy";
import type { ExistingCase } from "./matcher";
import type { SuiteResolution } from "./suite-context";
import type { TestRailClient, TestRailCase, TestRailSection } from "./client";

import { buildPlan, type PlanItem } from "./plan";
import { computeScenarioSignature } from "./signature";
import { toSeparatedSteps } from "./steps";
import { ensureRefsContain, toExistingCaseFromTestRail } from "./testrail-mapping";

export interface SyncOptions {
  readonly duplicatePolicy: DuplicatePolicy;
  readonly interactive?: boolean;
  readonly forcePrompt?: boolean;
  readonly maxPromptCandidates?: number;

  /** If true, do not mutate TestRail or feature files; only return the plan + messages. */
  readonly dryRun?: boolean;
  /** If true, update existing cases (steps/description/title) when reusing a match. */
  readonly updateExisting?: boolean;
  /**
   * Migration helper: when a scenario belongs to a Rule section but the matched case lives elsewhere,
   * create a new case in the rule section and tag the feature with the new id.
   *
   * Note: This intentionally avoids moving existing cases (TestRail move_cases endpoint is not available
   * in all installations).
   */
  readonly migrateToRuleSections?: boolean;

  /**
   * Which field to use for storing separated steps.
   * Most TestRail instances using the separated steps template use `custom_steps_separated`.
   */
  readonly stepsField?: string;
  /** Field for the long description (commonly `custom_test_case_description`). */
  readonly descriptionField?: string;
  /** Store our signature in `refs` by default; can be overridden for custom fields later. */
  readonly signatureToRefs?: boolean;

  /**
   * How to treat scenario outlines: "case" (default, one test case per outline) or "section" (outline becomes a section).
   */
  readonly outlineIs?: "case" | "section";
  /**
   * When outlineIs=section, how to treat Examples tables: "case" (default, rows as cases) or "section" (Examples as subsections).
   */
  readonly exampleIs?: "case" | "section";
}

export interface FeatureSyncResult {
  readonly featurePath: string;
  readonly sectionId: number;
  /** Mapping from rule name to section id (for rule-based sections). */
  readonly ruleSectionIdsByName: Readonly<Record<string, number>>;
  /** Mapping from outline signature to section id (when outlineIs=section). */
  readonly outlineSectionIdsBySignature?: Readonly<Record<string, number>>;
  /** Mapping from example key (outlineSignature:exampleIndex) to section id (when exampleIs=section). */
  readonly exampleSectionIdsByKey?: Readonly<Record<string, number>>;
  readonly suite?: SuiteResolution;
  readonly plan: readonly PlanItem[];
  /** Mapping from scenario signature to the resolved TestRail case id (after create/reuse). */
  readonly caseIdBySignature: Readonly<Record<string, number>>;
  readonly createdCases: readonly TestRailCase[];
  readonly updatedCases: readonly TestRailCase[];
  readonly messages: readonly string[];
}

export async function syncFeatureToTestRail(
  client: TestRailClient,
  suite: SuiteResolution,
  feature: ParsedFeature,
  projectId: number,
  options: SyncOptions
): Promise<FeatureSyncResult> {
  const messages: string[] = [];
  const dryRun = options.dryRun === true;

  const suiteId = suite.context.mode === "multi" ? suite.context.suiteId : undefined;

  const initialSections = await client.getSections(projectId, { ...(suiteId !== undefined ? { suiteId } : {}) });
  const { section: featureSection, sections } = await ensureFeatureSection(
    client,
    initialSections,
    projectId,
    feature,
    suiteId,
    { dryRun }
  );

  if (featureSection.id === -1) {
    messages.push(`[testrail] No existing section found for feature ${feature.path}; would create a new section in non-dry-run mode.`);
  } else {
    messages.push(`[testrail] Using section #${featureSection.id} for feature ${feature.path} (${feature.name}).`);
  }

  // Collect all descendant section IDs (feature section + all nested children/grandchildren)
  const descendantSectionIds = collectDescendantSectionIds(sections, featureSection.id);

  const existingCases =
    featureSection.id === -1
      ? []
      : (
          await Promise.all(
            [featureSection.id, ...descendantSectionIds].map((sectionId) =>
              loadExistingCases(client, projectId, {
                ...(suiteId !== undefined ? { suiteId } : {}),
                sectionId,
              })
            )
          )
        ).flat();

  const caseById = new Map<number, ExistingCase>();
  const casesBySignature = new Map<string, ExistingCase[]>();
  for (const c of existingCases) {
    caseById.set(c.id, c);
    if (c.signature) {
      const bucket = casesBySignature.get(c.signature) ?? [];
      bucket.push(c);
      casesBySignature.set(c.signature, bucket);
    }
  }

  const plan = await buildPlan({
    feature,
    existingCases,
    duplicatePolicy: options.duplicatePolicy,
    ...(options.outlineIs !== undefined ? { outlineIs: options.outlineIs } : {}),
    ...(options.exampleIs !== undefined ? { exampleIs: options.exampleIs } : {}),
    ...(options.interactive !== undefined ? { interactive: options.interactive } : {}),
    ...(options.forcePrompt !== undefined ? { forcePrompt: options.forcePrompt } : {}),
    ...(options.maxPromptCandidates !== undefined ? { maxPromptCandidates: options.maxPromptCandidates } : {}),
  });

  const nodeBySignature = new Map<string, FeatureChildNode>();
  for (const node of feature.children) {
    const sig = computeScenarioSignature({
      featurePath: feature.path,
      kind: node.kind,
      title: node.name,
      steps: node.steps,
      backgroundSteps: node.backgroundSteps,
      ...(node.kind === "outline"
        ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
        : {}),
    });
    nodeBySignature.set(sig, node);
  }

  if (dryRun) {
    const reuseEntries = plan
      .filter((p): p is PlanItem & { caseId: number } => p.action === "use" && typeof p.caseId === "number")
      .map((p) => [p.signature, p.caseId] as const);
    const reuseMap = Object.fromEntries(reuseEntries);
    return {
      featurePath: feature.path,
      sectionId: featureSection.id,
      ruleSectionIdsByName: {},
      suite,
      plan,
      caseIdBySignature: reuseMap,
      createdCases: [],
      updatedCases: [],
      messages,
    };
  }

  const createdCases: TestRailCase[] = [];
  const updatedCases: TestRailCase[] = [];
  const caseIdBySignature = new Map<string, number>();
  let mutableSections = [...sections];
  const ruleSectionsByName = new Map<string, TestRailSection>();
  const outlineSectionsBySignature = new Map<string, TestRailSection>();
  const exampleSectionsByKey = new Map<string, TestRailSection>();

  for (const item of plan) {
    if (item.action === "error") {
      throw new Error(item.message ?? "Plan contains error item");
    }

    if (item.action === "skip") {
      messages.push(pc.yellow(`[testrail] Skip ${item.nodeName} (${item.signature}).`));
      continue;
    }

    // Handle section items (outline sections and example subsections)
    if (item.itemType === "section") {
      if (item.kind === "outline" && item.exampleIndex === undefined) {
        // Outline section
        const result = await ensureOutlineSection(
          client,
          mutableSections,
          projectId,
          feature,
          featureSection,
          suiteId,
          item.nodeName,
          item.signature,
          { dryRun }
        );
        mutableSections = result.sections;
        outlineSectionsBySignature.set(item.signature, result.section);
        messages.push(
          result.section.id === -1
            ? pc.dim(`[testrail] Would create section for outline "${item.nodeName}".`)
            : pc.green(`[testrail] Using section #${result.section.id} for outline "${item.nodeName}".`)
        );
      } else if (item.exampleIndex !== undefined && item.parentSignature) {
        // Example subsection
        const parentOutlineSection = outlineSectionsBySignature.get(item.parentSignature);
        if (!parentOutlineSection) {
          throw new Error(`[testrail] Internal error: parent outline section not found for example section (${item.nodeName}).`);
        }
        const result = await ensureExampleSection(
          client,
          mutableSections,
          projectId,
          feature,
          parentOutlineSection,
          suiteId,
          item.exampleIndex,
          item.parentSignature,
          { dryRun }
        );
        mutableSections = result.sections;
        // Use the item's signature as the key (matches what row cases use as parentSignature)
        exampleSectionsByKey.set(item.signature, result.section);
        messages.push(
          result.section.id === -1
            ? pc.dim(`[testrail] Would create section for "${item.nodeName}".`)
            : pc.green(`[testrail] Using section #${result.section.id} for "${item.nodeName}".`)
        );
      }
      continue;
    }

    // Handle row cases (outline-row kind)
    if (item.kind === "outline-row") {
      // Determine the target section for this row
      let targetSectionId: number;
      if (item.parentSignature) {
        // parentSignature is either the example section signature or the outline signature
        // Check example sections first (when exampleIs=section)
        const exampleSection = exampleSectionsByKey.get(item.parentSignature);
        if (exampleSection) {
          targetSectionId = exampleSection.id;
        } else {
          // Parent is the outline section directly (when exampleIs=case)
          const outlineSection = outlineSectionsBySignature.get(item.parentSignature);
          if (outlineSection) {
            targetSectionId = outlineSection.id;
          } else {
            // Fallback to feature section
            targetSectionId = featureSection.id;
          }
        }
      } else {
        targetSectionId = featureSection.id;
      }

      if (item.action === "create") {
        if (targetSectionId === -1) {
          messages.push(pc.dim(`[testrail] Would create case for row "${item.nodeName}" (dry-run).`));
          continue;
        }
        const payload = buildRowCasePayload(item.nodeName, item.signature, options);
        const created = await client.addCase(targetSectionId, payload);
        createdCases.push(created);
        caseIdBySignature.set(item.signature, created.id);
        messages.push(pc.green(`[testrail] Created case #${created.id} for row "${item.nodeName}".`));
        continue;
      }

      // use action for row
      const caseId = item.caseId;
      if (caseId === undefined) {
        throw new Error(`[testrail] Internal error: plan item missing caseId for use action (${item.nodeName}).`);
      }
      caseIdBySignature.set(item.signature, caseId);
      messages.push(pc.cyan(`[testrail] Reusing case #${caseId} for row "${item.nodeName}".`));
      continue;
    }

    // Standard case handling for scenarios and outlines (when outlineIs=case)
    const node = nodeBySignature.get(item.signature);
    if (!node) {
      throw new Error(`[testrail] Internal error: node not found for plan item signature: ${item.nodeName} (${item.signature})`);
    }

    if (item.action === "create") {
      const targetSection = await resolveTargetSection(
        client,
        mutableSections,
        ruleSectionsByName,
        projectId,
        feature,
        featureSection,
        suiteId,
        node,
        { dryRun }
      );
      mutableSections = targetSection.sections;

      const created = await client.addCase(
        targetSection.section.id,
        buildCasePayload(feature, node, item.signature, suite, options)
      );
      createdCases.push(created);
      caseIdBySignature.set(item.signature, created.id);
      messages.push(pc.green(`[testrail] Created case #${created.id} for ${item.nodeName}.`));
      continue;
    }

    // use
    let caseId = item.caseId;
    if (caseId === undefined) {
      throw new Error(`[testrail] Internal error: plan item missing caseId for use action (${item.nodeName}).`);
    }

    if (options.migrateToRuleSections === true && node.rule?.name && featureSection.id !== -1) {
      const target = await resolveTargetSection(
        client,
        mutableSections,
        ruleSectionsByName,
        projectId,
        feature,
        featureSection,
        suiteId,
        node,
        { dryRun }
      );
      mutableSections = target.sections;

      if (target.section.id !== -1 && target.section.id !== featureSection.id) {
        const existingInTarget = (casesBySignature.get(item.signature) ?? []).find(
          (candidate) => candidate.sectionId === target.section.id
        );
        if (existingInTarget) {
          caseId = existingInTarget.id;
          messages.push(
            pc.cyan(
              `[testrail] Using existing case #${caseId} for ${item.nodeName} found in rule section "${target.section.name}".`
            )
          );
        } else {
          const currentSectionId =
            caseById.get(caseId)?.sectionId ?? (await client.getCase(caseId)).section_id ?? undefined;
          if (currentSectionId !== target.section.id) {
            const payload = buildCasePayload(feature, node, item.signature, suite, options);
            if (options.signatureToRefs !== false) {
              payload.refs = ensureRefsContain(
                typeof payload.refs === "string" ? payload.refs : item.signature,
                `autometa:migrated-from-case:${caseId}`
              );
            }
            const created = await client.addCase(target.section.id, payload);
            createdCases.push(created);
            caseIdBySignature.set(item.signature, created.id);
            messages.push(
              pc.green(
                `[testrail] Migrated ${item.nodeName}: cloned case #${caseId} into rule section "${target.section.name}" as #${created.id}.`
              )
            );
            continue;
          }
        }
      }
    }

    caseIdBySignature.set(item.signature, caseId);

    // Always ensure signature is present; optionally update content.
    const payload = buildCasePayload(feature, node, item.signature, suite, options);

    if (options.updateExisting === true) {
      if (options.signatureToRefs !== false) {
        const current = await client.getCase(caseId);
        const nextRefs = ensureRefsContain(typeof current.refs === "string" ? current.refs : undefined, item.signature);
        payload.refs = nextRefs;
      }
      const updated = await client.updateCase(caseId, payload);
      updatedCases.push(updated);
      messages.push(pc.cyan(`[testrail] Updated case #${caseId} for ${item.nodeName}.`));
    } else if (options.signatureToRefs !== false) {
      // Minimal update: ensure refs contains signature (preserve existing refs)
      const current = await client.getCase(caseId);
      const nextRefs = ensureRefsContain(typeof current.refs === "string" ? current.refs : undefined, item.signature);
      const updated = await client.updateCase(caseId, { refs: nextRefs });
      updatedCases.push(updated);
      messages.push(pc.cyan(`[testrail] Tagged case #${caseId} with signature for ${item.nodeName}.`));
    } else {
      messages.push(pc.cyan(`[testrail] Reusing case #${caseId} for ${item.nodeName}.`));
    }
  }

  return {
    featurePath: feature.path,
    sectionId: featureSection.id,
    ruleSectionIdsByName: Object.fromEntries(
      Array.from(ruleSectionsByName.entries()).map(([name, section]) => [name, section.id])
    ),
    ...(outlineSectionsBySignature.size > 0
      ? {
          outlineSectionIdsBySignature: Object.fromEntries(
            Array.from(outlineSectionsBySignature.entries()).map(([sig, section]) => [sig, section.id])
          ),
        }
      : {}),
    ...(exampleSectionsByKey.size > 0
      ? {
          exampleSectionIdsByKey: Object.fromEntries(
            Array.from(exampleSectionsByKey.entries()).map(([key, section]) => [key, section.id])
          ),
        }
      : {}),
    suite,
    plan,
    caseIdBySignature: Object.fromEntries(caseIdBySignature.entries()),
    createdCases,
    updatedCases,
    messages,
  };
}

async function ensureFeatureSection(
  client: TestRailClient,
  sections: readonly TestRailSection[],
  projectId: number,
  feature: ParsedFeature,
  suiteId: number | undefined,
  opts: { readonly dryRun: boolean }
): Promise<{ section: TestRailSection; sections: TestRailSection[] }> {
  const pathMarker = `autometa:featurePath=${feature.path}`;
  const byPath = sections.filter((s) => (s.description ?? "").includes(pathMarker));
  if (byPath.length > 0) {
    const first = byPath[0];
    if (first) {
      if (byPath.length === 1) {
        return { section: first, sections: [...sections] };
      }
      const named = byPath.find((s) => s.name.trim() === feature.name.trim());
      return { section: named ?? first, sections: [...sections] };
    }
  }

  const matches = sections.filter((s) => s.name.trim() === feature.name.trim());
  if (matches.length > 0) {
    const first = matches[0];
    if (first) {
      if (matches.length === 1) {
        return { section: first, sections: [...sections] };
      }

      // Best effort: prefer one with description containing feature path.
      const withPath = matches.find((s) => (s.description ?? "").includes(feature.path));
      return { section: withPath ?? first, sections: [...sections] };
    }
  }

  if (opts.dryRun) {
    // Fake section id for output only.
    return { section: { id: -1, name: feature.name, description: featureDescription(feature) }, sections: [...sections] };
  }

  const created = await client.addSection(projectId, {
    name: feature.name,
    description: featureDescription(feature),
    ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
  });
  return { section: created, sections: [...sections, created] };
}

function featureDescription(feature: ParsedFeature): string {
  const parts = [
    feature.description?.trim() ? feature.description.trim() : undefined,
    `autometa:featurePath=${feature.path}`,
  ].filter(Boolean);
  return parts.join("\n\n");
}

async function resolveTargetSection(
  client: TestRailClient,
  sections: readonly TestRailSection[],
  ruleSectionsByName: Map<string, TestRailSection>,
  projectId: number,
  feature: ParsedFeature,
  featureSection: TestRailSection,
  suiteId: number | undefined,
  node: FeatureChildNode,
  opts: { readonly dryRun: boolean }
): Promise<{ section: TestRailSection; sections: TestRailSection[] }> {
  const ruleName = node.rule?.name?.trim();
  if (!ruleName || featureSection.id === -1) {
    return { section: featureSection, sections: [...sections] };
  }

  const cached = ruleSectionsByName.get(ruleName);
  if (cached) {
    return { section: cached, sections: [...sections] };
  }

  const found = sections.find((s) => s.parent_id === featureSection.id && s.name.trim() === ruleName);
  if (found) {
    ruleSectionsByName.set(ruleName, found);
    return { section: found, sections: [...sections] };
  }

  if (opts.dryRun) {
    const fake: TestRailSection = {
      id: -1,
      name: ruleName,
      ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
      parent_id: featureSection.id,
      description: ruleDescription(feature, ruleName),
    };
    ruleSectionsByName.set(ruleName, fake);
    return { section: fake, sections: [...sections] };
  }

  const created = await client.addSection(projectId, {
    name: ruleName,
    description: ruleDescription(feature, ruleName),
    ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
    parent_id: featureSection.id,
  });
  ruleSectionsByName.set(ruleName, created);
  return { section: created, sections: [...sections, created] };
}

function ruleDescription(feature: ParsedFeature, ruleName: string): string {
  const parts = [`autometa:featurePath=${feature.path}`, `autometa:rule=${ruleName}`].filter(Boolean);
  return parts.join("\n");
}

/**
 * Ensure a section exists for a scenario outline when outlineIs=section.
 * Section is identified by the outline signature marker in description.
 *
 * @returns The outline section and updated sections list.
 */
export async function ensureOutlineSection(
  client: TestRailClient,
  sections: readonly TestRailSection[],
  projectId: number,
  feature: ParsedFeature,
  parentSection: TestRailSection,
  suiteId: number | undefined,
  outlineName: string,
  outlineSignature: string,
  opts: { readonly dryRun: boolean }
): Promise<{ section: TestRailSection; sections: TestRailSection[] }> {
  const signatureMarker = `autometa:signature=${outlineSignature}`;
  const outlineMarker = "autometa:outlineSection";

  // First, try to find by signature marker
  const bySignature = sections.find(
    (s) =>
      s.parent_id === parentSection.id &&
      (s.description ?? "").includes(signatureMarker) &&
      (s.description ?? "").includes(outlineMarker)
  );
  if (bySignature) {
    return { section: bySignature, sections: [...sections] };
  }

  // Fallback: match by name under parent (for migration)
  const byName = sections.find(
    (s) => s.parent_id === parentSection.id && s.name.trim() === outlineName.trim()
  );
  if (byName) {
    // Update description to include markers if missing
    if (!(byName.description ?? "").includes(signatureMarker)) {
      if (!opts.dryRun) {
        const updatedDescription = [byName.description ?? "", outlineMarker, signatureMarker]
          .filter(Boolean)
          .join("\n");
        await client.updateSection(byName.id, { description: updatedDescription });
      }
    }
    return { section: byName, sections: [...sections] };
  }

  // Create new section
  if (opts.dryRun) {
    const fake: TestRailSection = {
      id: -1,
      name: outlineName,
      parent_id: parentSection.id,
      description: outlineSectionDescription(feature, outlineSignature),
      ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
    };
    return { section: fake, sections: [...sections] };
  }

  const created = await client.addSection(projectId, {
    name: outlineName,
    description: outlineSectionDescription(feature, outlineSignature),
    parent_id: parentSection.id,
    ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
  });
  return { section: created, sections: [...sections, created] };
}

function outlineSectionDescription(feature: ParsedFeature, outlineSignature: string): string {
  return [
    `autometa:featurePath=${feature.path}`,
    "autometa:outlineSection",
    `autometa:signature=${outlineSignature}`,
  ].join("\n");
}

/**
 * Ensure a subsection exists for an Examples table when exampleIs=section.
 * Section is named "Examples #N" (1-indexed) and identified by exampleIndex marker.
 *
 * @returns The example section and updated sections list.
 */
export async function ensureExampleSection(
  client: TestRailClient,
  sections: readonly TestRailSection[],
  projectId: number,
  feature: ParsedFeature,
  outlineSection: TestRailSection,
  suiteId: number | undefined,
  exampleIndex: number,
  outlineSignature: string,
  opts: { readonly dryRun: boolean }
): Promise<{ section: TestRailSection; sections: TestRailSection[] }> {
  const exampleMarker = `autometa:exampleSection=${exampleIndex}`;
  const sectionName = `Examples #${exampleIndex + 1}`;

  // Try to find by example marker
  const byMarker = sections.find(
    (s) =>
      s.parent_id === outlineSection.id &&
      (s.description ?? "").includes(exampleMarker)
  );
  if (byMarker) {
    return { section: byMarker, sections: [...sections] };
  }

  // Fallback: match by name under outline section
  const byName = sections.find(
    (s) => s.parent_id === outlineSection.id && s.name.trim() === sectionName
  );
  if (byName) {
    // Update description to include marker if missing
    if (!(byName.description ?? "").includes(exampleMarker)) {
      if (!opts.dryRun) {
        const updatedDescription = [byName.description ?? "", exampleMarker].filter(Boolean).join("\n");
        await client.updateSection(byName.id, { description: updatedDescription });
      }
    }
    return { section: byName, sections: [...sections] };
  }

  // Create new section
  if (opts.dryRun) {
    const fake: TestRailSection = {
      id: -1,
      name: sectionName,
      parent_id: outlineSection.id,
      description: exampleSectionDescription(feature, exampleIndex, outlineSignature),
      ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
    };
    return { section: fake, sections: [...sections] };
  }

  const created = await client.addSection(projectId, {
    name: sectionName,
    description: exampleSectionDescription(feature, exampleIndex, outlineSignature),
    parent_id: outlineSection.id,
    ...(suiteId !== undefined ? { suite_id: suiteId } : {}),
  });
  return { section: created, sections: [...sections, created] };
}

function exampleSectionDescription(
  feature: ParsedFeature,
  exampleIndex: number,
  outlineSignature: string
): string {
  return [
    `autometa:featurePath=${feature.path}`,
    `autometa:exampleSection=${exampleIndex}`,
    `autometa:parentSignature=${outlineSignature}`,
  ].join("\n");
}

/**
 * Recursively collect all section IDs that are descendants of a given parent section.
 * This includes children, grandchildren, and so on.
 */
function collectDescendantSectionIds(
  sections: readonly TestRailSection[],
  parentId: number
): number[] {
  const result: number[] = [];
  const directChildren = sections.filter((s) => s.parent_id === parentId);

  for (const child of directChildren) {
    result.push(child.id);
    // Recursively collect grandchildren
    result.push(...collectDescendantSectionIds(sections, child.id));
  }

  return result;
}

async function loadExistingCases(
  client: TestRailClient,
  projectId: number,
  options: { readonly suiteId?: number; readonly sectionId?: number }
): Promise<ExistingCase[]> {
  const cases = await client.getCases(projectId, options);
  return cases.map(toExistingCaseFromTestRail);
}

function buildCasePayload(
  feature: ParsedFeature,
  node: FeatureChildNode,
  signature: string,
  suite: SuiteResolution,
  options: SyncOptions
): Record<string, unknown> {
  const stepsField = options.stepsField ?? "custom_steps_separated";
  const descriptionField = options.descriptionField ?? "custom_test_case_description";

  const steps = [...(node.backgroundSteps ?? []), ...(node.steps ?? [])];

  const payload: Record<string, unknown> = {
    title: node.name,
    [descriptionField]: node.description ?? feature.description ?? "",
    [stepsField]: toSeparatedSteps(steps),
  };

  if (options.signatureToRefs !== false) {
    payload.refs = signature;
  }

  // NOTE: suiteTag is intended for feature/scenario tags (write-back); we don't push it into TestRail by default.
  // It remains available in SuiteResolution for CLI messaging and future tag write-back.
  void suite;

  return payload;
}

/**
 * Build a minimal case payload for an outline row.
 * Row cases have interpolated titles and signatures but no direct node reference.
 */
function buildRowCasePayload(
  title: string,
  signature: string,
  options: SyncOptions
): Record<string, unknown> {
  const descriptionField = options.descriptionField ?? "custom_test_case_description";

  const payload: Record<string, unknown> = {
    title,
    [descriptionField]: "",
  };

  if (options.signatureToRefs !== false) {
    payload.refs = signature;
  }

  return payload;
}

export function computeNodeSignature(feature: ParsedFeature, node: ScenarioNode | ScenarioOutlineNode): string {
  return computeScenarioSignature({
    featurePath: feature.path,
    kind: node.kind,
    title: node.name,
    steps: node.steps,
    backgroundSteps: node.backgroundSteps,
    ...(node.kind === "outline"
      ? { exampleTables: node.examples.map((ex) => ({ headers: ex.headers, rowCount: ex.rows.length })) }
      : {}),
  });
}
