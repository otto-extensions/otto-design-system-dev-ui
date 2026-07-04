# Otto Design System Dev UI Extension Instructions

## Purpose
- This extension is a developer-facing UI and compiler trigger for the Otto Design System Authority Layer.
- This extension manages a single config file: `design-system.config.json`.

## Critical Rules
- Never generate API surfaces.
- Never generate CLI surfaces.
- All compile and update flows must route through Otto Command Service Layer commands.

## Command Contract
- Required commands:
  - `designSystem.updateConfig`
  - `designSystem.compile`
- Command payloads must include the resolved `configPath`.

## Compiler Contract
- Compiler modules may generate design-system files only inside `otto-design-system`.
- Compiler modules must validate config before writing outputs.
- Compiler modules must fail clearly on invalid config.

## Shipping Constraint
- This extension is for developers only and must not be bundled with applications.
