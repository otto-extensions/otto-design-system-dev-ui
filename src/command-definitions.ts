export const DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND = "designSystem.updateConfig";
export const DESIGN_SYSTEM_COMPILE_COMMAND = "designSystem.compile";
export const ORCHESTRATOR_SETTINGS_GET_COMMAND = "orchestrator.settings.get";
export const ORCHESTRATOR_SETTINGS_SET_COMMAND = "orchestrator.settings.set";
export const ORCHESTRATOR_SETTINGS_LIST_COMMAND = "orchestrator.settings.list";
export const ORCHESTRATOR_PAGE_SETTINGS_GET_COMMAND = "orchestrator.pageSettings.get";
export const ORCHESTRATOR_PAGE_SETTINGS_SET_COMMAND = "orchestrator.pageSettings.set";
export const ORCHESTRATOR_PAGE_SETTINGS_LIST_COMMAND = "orchestrator.pageSettings.list";

export interface DesignSystemUpdateConfigCommandPayload {
  configPath: string;
}

export interface DesignSystemCompileCommandPayload {
  configPath: string;
}

export interface DesignSystemCommandAck {
  accepted: boolean;
  commandName: string;
  configPath: string;
  message: string;
}

export interface OrchestratorSettings {
  pages: Record<string, PageSettings>;
}

export interface PageSettings {
  id: string;
  name: string;
  enabled: boolean;
  displayDurationMs: number;
  triggers: {
    timeBased: boolean;
    scheduleBased: boolean;
    weatherBased: boolean;
    phaseBased: boolean;
  };
  timeSettings?: {
    timeZone: string;
    useDaylightSavings: boolean;
    format: "12h" | "24h";
    style: "digital" | "analog";
  };
}

export interface OrchestratorSettingsSetPayload {
  patch: Partial<OrchestratorSettings>;
}
