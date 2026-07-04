import { validateDesignSystemConfig } from "../../compiler/validate.js";
import type { DesignSystemConfig } from "../design-system-config.js";
import type { ValidationMessage } from "./types.js";

export function buildValidationFeedback(config: DesignSystemConfig): ValidationMessage[] {
  const report = validateDesignSystemConfig(config);
  return report.issues.map((issue) => ({
    level: issue.severity,
    path: issue.path,
    message: issue.message
  }));
}
