export interface RuntimeDisplayConfig {
  defaults?: Record<string, string>;
  dsc?: Record<string, string>;
  themes?: Record<string, any>;
  displays?: Record<string, any>;
  moduleCatalog?: Record<string, any>;
}

export interface DesignSystemConfigLike {
  colors?: Record<string, string>;
  typography?: {
    families?: Record<string, string>;
    sizes?: Record<string, string>;
    weights?: Record<string, number>;
    lineHeights?: Record<string, number>;
  };
  motion?: {
    curves?: Record<string, string>;
    durations?: Record<string, number>;
  };
}

export function buildDisplayConfigBridge(
  runtimeConfig: RuntimeDisplayConfig,
  designConfig: DesignSystemConfigLike = {}
) {
  const nextConfig = structuredClone(runtimeConfig);
  const themes = nextConfig.themes ?? {};

  for (const [themeName, themeConfig] of Object.entries(themes)) {
    if (!themeConfig || typeof themeConfig !== "object") {
      continue;
    }

    const colors = themeConfig.colors ?? {};
    const fonts = themeConfig.fonts ?? {};
    const motion = themeConfig.motion ?? {};

    if (designConfig.colors?.primary) {
      colors.accent = colors.accent ?? designConfig.colors.primary;
    }
    if (designConfig.colors?.surface) {
      colors.surface = designConfig.colors.surface;
    }
    if (designConfig.colors?.text) {
      colors.text = designConfig.colors.text;
    }

    if (designConfig.typography?.families?.body) {
      fonts.body = designConfig.typography.families.body;
      fonts.heading = designConfig.typography.families.body;
    }

    if (designConfig.motion?.durations?.normal) {
      motion.page = `${designConfig.motion.durations.normal}ms ${designConfig.motion.curves?.standard ?? "ease"}`;
    }

    themeConfig.colors = colors;
    themeConfig.fonts = fonts;
    themeConfig.motion = motion;
    themes[themeName] = themeConfig;
  }

  nextConfig.themes = themes;
  nextConfig.dsc = {
    ...nextConfig.dsc,
    theme: nextConfig.dsc?.theme ?? "midnight"
  };

  return nextConfig;
}
