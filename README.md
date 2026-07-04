# Otto Design System Dev UI Extension

Otto Design System Dev UI provides a developer-only configuration and compile workflow for the Otto Design System Authority Layer.

## What This Extension Does
- Maintains one config file: `design-system.config.json`
- Provides developer UI scaffolding for:
  - colors
  - spacing
  - typography
  - motion curves and durations
  - elevation levels
  - radii
  - semantic variants
  - layout rules
  - behavior rules
  - state machine presets
- Sends config update and compile commands to the Otto Command Service Layer (CSL)
- Includes a compiler module inside this extension that generates modular design-system files inside `<app>/otto-design-system`

## What This Extension Never Does
- It never exposes API surfaces
- It never exposes CLI surfaces
- It never creates HTTP routes, servers, or CLI entrypoints

## Commands
- `designSystem.updateConfig`
- `designSystem.compile`

Both commands include `configPath` and are intended for CSL routing.

## Compiler Output Targets
The compiler writes generated modules into `<app>/otto-design-system`:
- `tokens/colors.ts`
- `tokens/spacing.ts`
- `tokens/typography.ts`
- `tokens/motion.ts`
- `tokens/elevation.ts`
- `tokens/radii.ts`
- `components/*`
- `behaviors/*`
- `state/*`
- `layout/*`
- `motion/*`

## CSL Integration
1. Import this extension package from the command-service workspace.
2. Register command handlers in CSL:
  - `designSystem.updateConfig`: accept `configPath` and trigger internal bookkeeping.
  - `designSystem.compile`: invoke `compileDesignSystem` from this extension's compiler module.
3. CSL must call the compiler with `invocationSource: "csl"`.

## Example Usage
```ts
import { compileDesignSystem } from "./compiler/compile.js";

await compileDesignSystem({
  appRoot: process.cwd(),
  invocationSource: "csl"
});
```

## Validation
- `npm test`
- `npm run typecheck`

## Deployment Constraint
This extension is for developer workflows only and must not be shipped inside applications.
