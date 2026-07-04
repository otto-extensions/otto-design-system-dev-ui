import { promises as fs } from "node:fs";
import path from "node:path";

import { generateBehaviors } from "./generateBehaviors.js";
import { generateComponents } from "./generateComponents.js";
import { generateLayout } from "./generateLayout.js";
import { generateMotion } from "./generateMotion.js";
import { generateStateMachines } from "./generateStateMachines.js";
import { generateTokens } from "./generateTokens.js";
import { loadAndValidateConfig } from "./validate.js";

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export interface CompileOptions {
  appRoot: string;
  invocationSource: "csl";
  configPath?: string;
  designSystemRoot?: string;
}

export interface CompileResult {
  configPath: string;
  designSystemRoot: string;
  generatedAt: string;
  files: string[];
}

function resolveConfigPath(appRoot: string, explicitPath?: string): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  return path.resolve(appRoot, "design-system.config.json");
}

function resolveDesignSystemRoot(appRoot: string, explicitPath?: string): string {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }

  return path.resolve(appRoot, "otto-design-system");
}

async function writeGenerated(targetPath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
}

export async function compileDesignSystem(options: CompileOptions): Promise<CompileResult> {
  if (options.invocationSource !== "csl") {
    throw new Error("Compiler invocation rejected: compileDesignSystem can only be invoked by CSL.");
  }

  const appRoot = path.resolve(options.appRoot);
  const configPath = resolveConfigPath(appRoot, options.configPath);
  const { config, report } = await loadAndValidateConfig(configPath);
  if (!report.valid) {
    const messages = report.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`Design system config validation failed: ${messages}`);
  }

  const designSystemRoot = resolveDesignSystemRoot(appRoot, options.designSystemRoot);

  const files = [
    ...generateTokens(config),
    ...generateComponents(config),
    ...generateBehaviors(config),
    ...generateStateMachines(config),
    ...generateLayout(config),
    ...generateMotion(config)
  ];

  for (const file of files) {
    const normalized = file.relativePath.replace(/\\/g, "/");
    if (normalized.startsWith("api/") || normalized.startsWith("cli/")) {
      throw new Error(`Forbidden compiler output path: ${file.relativePath}`);
    }
  }

  await Promise.all(
    files.map((file) => writeGenerated(path.join(designSystemRoot, file.relativePath), file.content))
  );

  return {
    configPath,
    designSystemRoot,
    generatedAt: new Date().toISOString(),
    files: files.map((file) => path.join(designSystemRoot, file.relativePath))
  };
}
