import type { DesignSystemConfigPatch } from "../design-system-config.js";
import type { DeveloperUiState } from "./types.js";
import { buildDeveloperUiState } from "./state.js";
import type { DesignSystemDevUiExtension } from "../index.js";

export interface DeveloperUiController {
  refresh(): Promise<DeveloperUiState>;
  updateConfig(patch: DesignSystemConfigPatch): Promise<DeveloperUiState>;
  compile(): Promise<void>;
}

export function createDeveloperUiController(extension: DesignSystemDevUiExtension): DeveloperUiController {
  return {
    async refresh() {
      const config = await extension.getConfig();
      return buildDeveloperUiState(config);
    },
    async updateConfig(patch) {
      const config = await extension.updateConfig(patch);
      return buildDeveloperUiState(config);
    },
    async compile() {
      await extension.compileDesignSystem();
    }
  };
}
