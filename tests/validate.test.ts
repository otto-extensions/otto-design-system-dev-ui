import test from "node:test";
import assert from "node:assert/strict";

import { defaultDesignSystemConfig } from "../src/design-system-config.js";
import { validateDesignSystemConfig } from "../compiler/validate.js";

test("default config validates successfully", () => {
  const report = validateDesignSystemConfig(defaultDesignSystemConfig);
  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

test("invalid behavior fields are flagged", () => {
  const report = validateDesignSystemConfig({
    ...defaultDesignSystemConfig,
    behaviors: {
      ...defaultDesignSystemConfig.behaviors,
      disabledOpacity: Number.NaN
    }
  });

  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.path === "behaviors.disabledOpacity"));
});

test("page-level overrides are rejected", () => {
  const report = validateDesignSystemConfig({
    ...defaultDesignSystemConfig,
    layout: {
      ...defaultDesignSystemConfig.layout,
      pageRules: {
        dashboard: {
          columns: 20
        }
      }
    } as unknown as typeof defaultDesignSystemConfig.layout
  });

  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.message.includes("Page-level overrides are forbidden")));
});

test("semantic variants must reference known color tokens", () => {
  const report = validateDesignSystemConfig({
    ...defaultDesignSystemConfig,
    semanticVariants: {
      ...defaultDesignSystemConfig.semanticVariants,
      broken: {
        background: "notAColorToken",
        text: "surface",
        border: "primary"
      }
    }
  });

  assert.equal(report.valid, false);
  assert.ok(report.issues.some((issue) => issue.path === "semanticVariants.broken.background"));
});
