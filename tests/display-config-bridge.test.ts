import assert from "node:assert/strict";
import test from "node:test";

import { buildDisplayConfigBridge } from "../src/display-config-bridge.js";

test("bridge applies design-system values to the live display config", () => {
  const runtimeConfig = {
    defaults: { displayId: "hallway", pageId: "announcements" },
    dsc: { transition: "fade", theme: "midnight" },
    themes: {
      midnight: {
        colors: {
          background: "#0b132b",
          surface: "rgba(255,255,255,0.10)",
          text: "#f4f7fb",
          muted: "#dfe8f5",
          accent: "#ffd166",
          border: "rgba(110,202,255,0.95)"
        },
        fonts: { body: "Segoe UI, Helvetica Neue, sans-serif" },
        motion: { page: "320ms cubic-bezier(0.22, 1, 0.36, 1)" },
        backgrounds: { page: "linear-gradient(135deg, #0b132b 0%, #1c2541 42%, #3a506b 100%)" }
      }
    }
  };

  const designConfig = {
    colors: {
      primary: "#1f6feb",
      surface: "#0f172a",
      text: "#e2e8f0",
      danger: "#ef4444"
    },
    typography: {
      families: {
        body: "Inter, ui-sans-serif, sans-serif"
      }
    },
    motion: {
      durations: { normal: 240 },
      curves: { standard: "cubic-bezier(0.2, 0, 0, 1)" }
    }
  };

  const merged = buildDisplayConfigBridge(runtimeConfig, designConfig);

  assert.equal(merged.themes!.midnight.colors.accent, "#1f6feb");
  assert.equal(merged.themes!.midnight.colors.surface, "#0f172a");
  assert.equal(merged.themes!.midnight.fonts.body, "Inter, ui-sans-serif, sans-serif");
  assert.equal(merged.themes!.midnight.motion.page, "240ms cubic-bezier(0.2, 0, 0, 1)");
});
