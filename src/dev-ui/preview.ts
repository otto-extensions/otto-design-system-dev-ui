import type { DesignSystemConfig } from "../design-system-config.js";
import type { PreviewComponent } from "./types.js";

export function buildLivePreview(config: DesignSystemConfig): PreviewComponent[] {
  return [
    {
      id: "button-primary",
      name: "Primary Button",
      style: {
        background: config.colors.primary,
        color: config.colors.surface,
        borderRadius: config.radii.md,
        paddingInline: config.spacing.lg,
        paddingBlock: config.spacing.sm,
        boxShadow: config.elevation["1"],
        transitionTimingFunction: config.motion.curves.standard,
        transitionDuration: `${config.motion.durations.fast}ms`
      },
      note: "Shows color, spacing, radii, elevation, and motion tokens."
    },
    {
      id: "card-surface",
      name: "Surface Card",
      style: {
        background: config.colors.surfaceSubtle,
        color: config.colors.text,
        borderRadius: config.radii.lg,
        boxShadow: config.elevation["2"],
        padding: config.spacing.lg,
        maxWidth: config.layout.container.maxWidth
      },
      note: "Shows container, elevation, and semantic text contrast."
    },
    {
      id: "state-request-machine",
      name: "Request State Preset",
      style: {
        initial: config.stateMachinePresets.request?.initial ?? "missing",
        states: (config.stateMachinePresets.request?.states ?? []).join(", ")
      },
      note: "Shows state machine preset projection for request lifecycle."
    }
  ];
}
