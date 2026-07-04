import type { DesignSystemConfig } from "../design-system-config.js";

export interface PreviewComponent {
  id: string;
  name: string;
  style: Record<string, string | number | boolean>;
  note: string;
}

export interface ValidationMessage {
  level: "error" | "warning";
  path: string;
  message: string;
}

export interface DeveloperUiState {
  config: DesignSystemConfig;
  preview: PreviewComponent[];
  validation: ValidationMessage[];
  updatedAt: string;
}
