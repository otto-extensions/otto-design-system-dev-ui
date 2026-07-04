import { promises as fs } from "node:fs";

import type { DesignSystemConfig, StateMachinePreset } from "../src/design-system-config.js";

export interface ValidationIssue {
  severity: "error" | "warning";
  path: string;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireRecord(issues: ValidationIssue[], root: Record<string, unknown>, key: string): Record<string, unknown> {
  const value = root[key];
  if (!isRecord(value)) {
    issues.push({
      severity: "error",
      path: key,
      message: `Expected '${key}' to be an object.`
    });
    return {};
  }

  return value;
}

function validateStringMap(
  issues: ValidationIssue[],
  value: Record<string, unknown>,
  path: string
): void {
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "string") {
      issues.push({
        severity: "error",
        path: `${path}.${key}`,
        message: "Expected a string value."
      });
    }
  }
}

function validateNumberMap(
  issues: ValidationIssue[],
  value: Record<string, unknown>,
  path: string
): void {
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "number" || Number.isNaN(entry)) {
      issues.push({
        severity: "error",
        path: `${path}.${key}`,
        message: "Expected a numeric value."
      });
    }
  }
}

function validatePreset(issues: ValidationIssue[], key: string, preset: unknown): void {
  if (!isRecord(preset)) {
    issues.push({
      severity: "error",
      path: `stateMachinePresets.${key}`,
      message: "State machine preset must be an object."
    });
    return;
  }

  const initial = preset.initial;
  const states = preset.states;
  const transitions = preset.transitions;

  if (typeof initial !== "string" || initial.length === 0) {
    issues.push({
      severity: "error",
      path: `stateMachinePresets.${key}.initial`,
      message: "Initial state must be a non-empty string."
    });
  }

  if (!Array.isArray(states) || states.some((item) => typeof item !== "string")) {
    issues.push({
      severity: "error",
      path: `stateMachinePresets.${key}.states`,
      message: "States must be a string array."
    });
  }

  if (!isRecord(transitions)) {
    issues.push({
      severity: "error",
      path: `stateMachinePresets.${key}.transitions`,
      message: "Transitions must be a state-to-state-list map."
    });
    return;
  }

  for (const [from, nextStates] of Object.entries(transitions)) {
    if (!Array.isArray(nextStates) || nextStates.some((item) => typeof item !== "string")) {
      issues.push({
        severity: "error",
        path: `stateMachinePresets.${key}.transitions.${from}`,
        message: "Each transition entry must be an array of state names."
      });
    }
  }
}

function validateNoPageLevelOverrides(
  issues: ValidationIssue[],
  value: unknown,
  pathParts: string[] = []
): void {
  if (!isRecord(value)) {
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    const lowered = key.toLowerCase();
    if (lowered.includes("page") || lowered.includes("screen") || lowered.includes("route")) {
      issues.push({
        severity: "error",
        path: [...pathParts, key].join("."),
        message: "Page-level overrides are forbidden in design-system config."
      });
    }

    if (isRecord(entry)) {
      validateNoPageLevelOverrides(issues, entry, [...pathParts, key]);
    }
  }
}

export function validateDesignSystemConfig(config: DesignSystemConfig): ValidationReport {
  const issues: ValidationIssue[] = [];
  const root = config as unknown as Record<string, unknown>;

  validateNoPageLevelOverrides(issues, root);

  validateStringMap(issues, requireRecord(issues, root, "colors"), "colors");
  validateStringMap(issues, requireRecord(issues, root, "spacing"), "spacing");
  validateStringMap(issues, requireRecord(issues, root, "elevation"), "elevation");
  validateStringMap(issues, requireRecord(issues, root, "radii"), "radii");

  const typography = requireRecord(issues, root, "typography");
  validateStringMap(issues, requireRecord(issues, typography, "families"), "typography.families");
  validateStringMap(issues, requireRecord(issues, typography, "sizes"), "typography.sizes");
  validateNumberMap(issues, requireRecord(issues, typography, "weights"), "typography.weights");
  validateNumberMap(issues, requireRecord(issues, typography, "lineHeights"), "typography.lineHeights");

  const motion = requireRecord(issues, root, "motion");
  const motionCurves = requireRecord(issues, motion, "curves");
  validateStringMap(issues, motionCurves, "motion.curves");
  const motionDurations = requireRecord(issues, motion, "durations");
  validateNumberMap(issues, motionDurations, "motion.durations");
  for (const [durationKey, durationValue] of Object.entries(motionDurations)) {
    if (typeof durationValue === "number" && durationValue <= 0) {
      issues.push({
        severity: "error",
        path: `motion.durations.${durationKey}`,
        message: "Motion duration values must be greater than 0."
      });
    }
  }

  const layout = requireRecord(issues, root, "layout");
  const grid = requireRecord(issues, layout, "grid");
  const columns = grid.columns;
  if (typeof columns !== "number" || columns < 1) {
    issues.push({
      severity: "error",
      path: "layout.grid.columns",
      message: "Grid columns must be a number >= 1."
    });
  }
  if (typeof grid.gutter !== "string") {
    issues.push({
      severity: "error",
      path: "layout.grid.gutter",
      message: "Grid gutter must be a string token value."
    });
  }

  const container = requireRecord(issues, layout, "container");
  if (typeof container.maxWidth !== "string") {
    issues.push({
      severity: "error",
      path: "layout.container.maxWidth",
      message: "Container maxWidth must be a string token value."
    });
  }
  if (typeof container.padding !== "string") {
    issues.push({
      severity: "error",
      path: "layout.container.padding",
      message: "Container padding must be a string token value."
    });
  }

  const behaviors = requireRecord(issues, root, "behaviors");
  if (typeof behaviors.focusRing !== "string") {
    issues.push({
      severity: "error",
      path: "behaviors.focusRing",
      message: "Focus ring must be a string token value."
    });
  }
  if (typeof behaviors.hoverLift !== "boolean") {
    issues.push({
      severity: "error",
      path: "behaviors.hoverLift",
      message: "hoverLift must be a boolean."
    });
  }
  if (typeof behaviors.pressScale !== "number" || !Number.isFinite(behaviors.pressScale)) {
    issues.push({
      severity: "error",
      path: "behaviors.pressScale",
      message: "pressScale must be a number."
    });
  }
  if (typeof behaviors.disabledOpacity !== "number" || !Number.isFinite(behaviors.disabledOpacity)) {
    issues.push({
      severity: "error",
      path: "behaviors.disabledOpacity",
      message: "disabledOpacity must be a number."
    });
  }

  const semanticVariants = requireRecord(issues, root, "semanticVariants");
  const colorTokens = requireRecord(issues, root, "colors");
  for (const [variantKey, variantValue] of Object.entries(semanticVariants)) {
    if (!isRecord(variantValue)) {
      issues.push({
        severity: "error",
        path: `semanticVariants.${variantKey}`,
        message: "Each semantic variant must be an object."
      });
      continue;
    }

    for (const variantField of ["background", "text", "border"]) {
      const fieldValue = variantValue[variantField];
      if (typeof fieldValue !== "string") {
        issues.push({
          severity: "error",
          path: `semanticVariants.${variantKey}.${variantField}`,
          message: "Semantic variant fields must be string color keys."
        });
      } else if (!(fieldValue in colorTokens)) {
        issues.push({
          severity: "error",
          path: `semanticVariants.${variantKey}.${variantField}`,
          message: `Semantic variant token '${fieldValue}' does not exist in colors.`
        });
      }
    }

    const extraFields = Object.keys(variantValue).filter(
      (field) => field !== "background" && field !== "text" && field !== "border"
    );
    if (extraFields.length > 0) {
      issues.push({
        severity: "error",
        path: `semanticVariants.${variantKey}`,
        message: `Unsupported semantic variant fields: ${extraFields.join(", ")}`
      });
    }
  }

  const statePresets = requireRecord(issues, root, "stateMachinePresets");
  for (const [key, preset] of Object.entries(statePresets)) {
    validatePreset(issues, key, preset as StateMachinePreset);
  }

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues
  };
}

export async function loadAndValidateConfig(configPath: string): Promise<{
  config: DesignSystemConfig;
  report: ValidationReport;
}> {
  const content = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(content) as DesignSystemConfig;
  const report = validateDesignSystemConfig(config);
  return { config, report };
}
