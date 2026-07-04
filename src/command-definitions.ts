export const DESIGN_SYSTEM_UPDATE_CONFIG_COMMAND = "designSystem.updateConfig";
export const DESIGN_SYSTEM_COMPILE_COMMAND = "designSystem.compile";

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
