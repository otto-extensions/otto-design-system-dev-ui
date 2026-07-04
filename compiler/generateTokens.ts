import type { DesignSystemConfig } from "../src/design-system-config.js";
import type { GeneratedFile } from "./compile.js";

function buildTokenFile(exportName: string, value: unknown): string {
  return `// GENERATED FILE - DO NOT EDIT DIRECTLY.
const deepFreeze = <T>(input: T): T => {
  if (typeof input !== "object" || input === null || Object.isFrozen(input)) {
    return input;
  }

  const objectInput = input as Record<string, unknown>;
  for (const key of Object.keys(objectInput)) {
    const child = objectInput[key];
    if (typeof child === "object" && child !== null) {
      deepFreeze(child);
    }
  }

  return Object.freeze(input);
};

export const ${exportName} = deepFreeze(${JSON.stringify(value, null, 2)} as const);
`;
}

export function generateTokens(config: DesignSystemConfig): GeneratedFile[] {
  return [
    {
      relativePath: "tokens/colors.ts",
      content: buildTokenFile("colorTokens", config.colors)
    },
    {
      relativePath: "tokens/spacing.ts",
      content: buildTokenFile("spacingTokens", config.spacing)
    },
    {
      relativePath: "tokens/typography.ts",
      content: buildTokenFile("typographyTokens", config.typography)
    },
    {
      relativePath: "tokens/motion.ts",
      content: buildTokenFile("motionTokens", config.motion)
    },
    {
      relativePath: "tokens/elevation.ts",
      content: buildTokenFile("elevationTokens", config.elevation)
    },
    {
      relativePath: "tokens/radii.ts",
      content: buildTokenFile("radiiTokens", config.radii)
    },
    {
      relativePath: "tokens/index.ts",
      content: `// GENERATED FILE - DO NOT EDIT DIRECTLY.
export { colorTokens } from "./colors.js";
export { spacingTokens } from "./spacing.js";
export { typographyTokens } from "./typography.js";
export { motionTokens } from "./motion.js";
export { elevationTokens } from "./elevation.js";
export { radiiTokens } from "./radii.js";
`
    }
  ];
}
