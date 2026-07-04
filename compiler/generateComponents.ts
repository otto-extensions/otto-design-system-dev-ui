import type { DesignSystemConfig } from "../src/design-system-config.js";
import type { GeneratedFile } from "./compile.js";

export function generateComponents(config: DesignSystemConfig): GeneratedFile[] {
  return [
    {
      relativePath: "components/semantic-variants.ts",
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

export const semanticVariants = deepFreeze(${JSON.stringify(config.semanticVariants, null, 2)} as const);
`
    },
    {
      relativePath: "components/primitives.ts",
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

const colorTokens = ${JSON.stringify(config.colors, null, 2)} as const;

export const componentPrimitives = deepFreeze({
  Button: {
    borderRadius: ${JSON.stringify(config.radii.md)},
    paddingInline: ${JSON.stringify(config.spacing.lg)},
    paddingBlock: ${JSON.stringify(config.spacing.sm)}
  },
  Card: {
    borderRadius: ${JSON.stringify(config.radii.lg)},
    padding: ${JSON.stringify(config.spacing.lg)},
    surface: colorTokens.surface,
    text: colorTokens.text
  }
} as const);
`
    },
    {
      relativePath: "components/index.ts",
      content: `// GENERATED FILE - DO NOT EDIT DIRECTLY.
export { semanticVariants } from "./semantic-variants.js";
export { componentPrimitives } from "./primitives.js";
`
    }
  ];
}
