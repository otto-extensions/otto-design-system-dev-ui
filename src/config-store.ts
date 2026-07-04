import { promises as fs } from "node:fs";
import path from "node:path";

import {
  defaultDesignSystemConfig,
  type DesignSystemConfig,
  type DesignSystemConfigPatch
} from "./design-system-config.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function deepMerge<T extends object>(target: T, patch: Partial<T>): T {
  const merged: Record<string, unknown> = { ...(target as Record<string, unknown>) };

  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (isObject(value) && isObject(merged[key])) {
      merged[key] = deepMerge(merged[key] as Record<string, unknown>, value);
      continue;
    }

    merged[key] = value;
  }

  return merged as T;
}

export function resolveConfigPath(repoRoot = process.cwd(), explicitPath?: string): string {
  return explicitPath ? path.resolve(explicitPath) : path.resolve(repoRoot, "design-system.config.json");
}

export async function readDesignSystemConfig(configPath: string): Promise<DesignSystemConfig> {
  try {
    const content = await fs.readFile(configPath, "utf8");
    return JSON.parse(content) as DesignSystemConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultDesignSystemConfig;
    }

    throw error;
  }
}

export async function writeDesignSystemConfig(configPath: string, config: DesignSystemConfig): Promise<void> {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function patchDesignSystemConfig(
  configPath: string,
  patch: DesignSystemConfigPatch
): Promise<DesignSystemConfig> {
  const current = await readDesignSystemConfig(configPath);
  const merged = deepMerge(
    current as unknown as Record<string, unknown>,
    patch as unknown as Partial<Record<string, unknown>>
  ) as unknown as DesignSystemConfig;
  await writeDesignSystemConfig(configPath, merged);
  return merged;
}
