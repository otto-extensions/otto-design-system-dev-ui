import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

import { compileDesignSystem } from "../compiler/compile.js";
import { defaultDesignSystemConfig } from "../src/design-system-config.js";

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

test("compile writes generated design-system modules", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "otto-design-system-dev-ui-"));
  const configPath = path.join(tempRoot, "design-system.config.json");
  const designSystemRoot = path.join(tempRoot, "otto-design-system");

  await fs.mkdir(designSystemRoot, { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(defaultDesignSystemConfig, null, 2)}\n`, "utf8");

  const result = await compileDesignSystem({
    appRoot: tempRoot,
    invocationSource: "csl",
    configPath
  });

  assert.equal(result.files.length, 18);
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/colors.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/spacing.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/typography.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/motion.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/elevation.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "tokens/radii.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "components/primitives.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "behaviors/rules.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "state/presets.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "layout/rules.ts")));
  assert.ok(await pathExists(path.join(designSystemRoot, "motion/rules.ts")));
});

test("compile rejects non-CSL invocation", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "otto-design-system-dev-ui-"));
  const configPath = path.join(tempRoot, "design-system.config.json");
  await fs.writeFile(configPath, `${JSON.stringify(defaultDesignSystemConfig, null, 2)}\n`, "utf8");

  await assert.rejects(
    compileDesignSystem({
      appRoot: tempRoot,
      invocationSource: "manual" as "csl",
      configPath
    }),
    /only be invoked by CSL/
  );
});
