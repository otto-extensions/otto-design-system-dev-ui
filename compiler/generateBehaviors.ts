import type { DesignSystemConfig } from "../src/design-system-config.js";
import type { GeneratedFile } from "./compile.js";

export function generateBehaviors(config: DesignSystemConfig): GeneratedFile[] {
  return [
    {
      relativePath: "behaviors/rules.ts",
      content: `// GENERATED FILE - DO NOT EDIT DIRECTLY.
const deepFreeze = <T>(input: T): T => {
  if (typeof input !== "object" || input === null || Object.isFrozen(input)) {
    return input;
  }
  for (const key of Object.keys(input as Record<string, unknown>)) {
    const child = (input as Record<string, unknown>)[key];
    if (typeof child === "object" && child !== null) {
      deepFreeze(child);
    }
  }
  return Object.freeze(input);
};

export const behaviorRules = deepFreeze(${JSON.stringify(config.behaviors, null, 2)} as const);
`
    },
    {
      relativePath: "behaviors/index.ts",
      content: `// GENERATED FILE - DO NOT EDIT DIRECTLY.
export { behaviorRules } from "./rules.js";
`
    }
  ];
}
