export const DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND = "designSystem.updateConfig";
export const DESIGN_SYSTEM_COMPILE_COMMAND = "designSystem.compile";
export const ORCHESTRATOR_SETTINGS_GET_COMMAND = "orchestrator.settings.get";
export const ORCHESTRATOR_SETTINGS_SET_COMMAND = "orchestrator.settings.set";
export const ORCHESTRATOR_SETTINGS_LIST_COMMAND = "orchestrator.settings.list";

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
  enabledPages: string[];
  rotationIntervalMs: number;
  rotationMode: "time" | "schedule" | "weather" | "phase";
  weatherTriggers: { severeWeather: boolean; tempThreshold: number };
  scheduleTriggers: { classChange: boolean; passingPeriod: boolean };
  phaseTriggers: { chapel: boolean; assembly: boolean; emergency: boolean };
}

export interface OrchestratorSettingsSetPayload {
  patch: Partial<OrchestratorSettings>;
}
