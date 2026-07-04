import type {
  DesignSystemCommandAck,
  DesignSystemCompileCommandPayload,
  DesignSystemUpdateConfigCommandPayload
} from "./command-definitions.js";
import {
  DESIGN_SYSTEM_COMPILE_COMMAND,
  DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND
} from "./command-definitions.js";
import {
  patchDesignSystemConfig,
  readDesignSystemConfig,
  resolveConfigPath
} from "./config-store.js";
import type { DesignSystemConfig, DesignSystemConfigPatch } from "./design-system-config.js";

export interface CslCommandRunner {
  run<TInput, TOutput>(commandName: string, payload: TInput): Promise<TOutput>;
}

export interface DesignSystemDevUiExtensionOptions {
  commandService: CslCommandRunner;
  repoRoot?: string;
  configPath?: string;
}

export interface DesignSystemDevUiExtension {
  configPath: string;
  getConfig(): Promise<DesignSystemConfig>;
  updateConfig(patch: DesignSystemConfigPatch): Promise<DesignSystemConfig>;
  notifyConfigUpdated(): Promise<DesignSystemCommandAck>;
  compileDesignSystem(): Promise<DesignSystemCommandAck>;
}

export function createDesignSystemDevUiExtension(
  options: DesignSystemDevUiExtensionOptions
): DesignSystemDevUiExtension {
  const resolvedConfigPath = resolveConfigPath(options.repoRoot, options.configPath);

  return {
    configPath: resolvedConfigPath,
    getConfig: async () => readDesignSystemConfig(resolvedConfigPath),
    updateConfig: async (patch) => patchDesignSystemConfig(resolvedConfigPath, patch),
    notifyConfigUpdated: async () =>
      options.commandService.run<DesignSystemUpdateConfigCommandPayload, DesignSystemCommandAck>(
        DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND,
        { configPath: resolvedConfigPath }
      ),
    compileDesignSystem: async () =>
      options.commandService.run<DesignSystemCompileCommandPayload, DesignSystemCommandAck>(
        DESIGN_SYSTEM_COMPILE_COMMAND,
        { configPath: resolvedConfigPath }
      )
  };
}

export {
  DESIGN_SYSTEM_COMPILE_COMMAND,
  DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND
} from "./command-definitions.js";
export type {
  DesignSystemCommandAck,
  DesignSystemCompileCommandPayload,
  DesignSystemUpdateConfigCommandPayload
} from "./command-definitions.js";
export type { DesignSystemConfig, DesignSystemConfigPatch } from "./design-system-config.js";
