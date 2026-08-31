import type {
  OrchestratorSettings as OrchestratorSettingsContract
} from "../../otto-display-orchestrator/src/features/settings/models/OrchestratorSettings.js";
import {
  ORCHESTRATOR_PAGE_SETTINGS_GET_COMMAND,
  ORCHESTRATOR_PAGE_SETTINGS_LIST_COMMAND,
  ORCHESTRATOR_PAGE_SETTINGS_SET_COMMAND,
  ORCHESTRATOR_SETTINGS_GET_COMMAND,
  ORCHESTRATOR_SETTINGS_LIST_COMMAND,
  ORCHESTRATOR_SETTINGS_SET_COMMAND
} from "../../otto-display-orchestrator/src/features/settings/commands/registerSettingsCommands.js";

export type { OrchestratorSettingsContract };

export const orchestratorSettingsCommandNames = {
  get: ORCHESTRATOR_SETTINGS_GET_COMMAND,
  set: ORCHESTRATOR_SETTINGS_SET_COMMAND,
  list: ORCHESTRATOR_SETTINGS_LIST_COMMAND,
  pageGet: ORCHESTRATOR_PAGE_SETTINGS_GET_COMMAND,
  pageSet: ORCHESTRATOR_PAGE_SETTINGS_SET_COMMAND,
  pageList: ORCHESTRATOR_PAGE_SETTINGS_LIST_COMMAND
};
