# Otto Design System Dev UI MemPalace

Created: 2026-09-01
Purpose: Memory for Dev UI orchestration editing workflows and contract-driven appearance consumption.

## UX Guardrails

- Keep controls grouped by task: registry, tiers, per-page controls, actions, status.
- Favor obvious defaults and progressive disclosure (Basics vs Advanced Triggers).
- Absolute URLs must be copyable and include host/IP for operator workflows.

## Contract Integration

- Appearance tokens should be applied from DCS contract data when available.
- Dev UI remains behavior editor; behavior semantics are persisted via orchestrator settings commands.

## Recent Lessons

- 2026-09-01: Literal template text in page cards was caused by missing template interpolation markers in rendered strings.
- 2026-09-01: Live stale UI can be process-cache related on Pi; verify deployed files and restart runtime service when routes/UI appear unchanged.
