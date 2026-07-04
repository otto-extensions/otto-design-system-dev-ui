import { buildValidationFeedback } from "./validation-feedback.js";
import { buildLivePreview } from "./preview.js";
import type { DesignSystemConfig } from "../design-system-config.js";
import type { DeveloperUiState } from "./types.js";

export function buildDeveloperUiState(config: DesignSystemConfig): DeveloperUiState {
  return {
    config,
    preview: buildLivePreview(config),
    validation: buildValidationFeedback(config),
    updatedAt: new Date().toISOString()
  };
}
