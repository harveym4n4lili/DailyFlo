/**
 * configurable mesh + blur backgrounds (radial blobs + gaussian blur + optional veil).
 * presets live here so screens only override what they need.
 */

export type MeshBlob = {
  /** center x as fraction of width 0–1 */
  cx: number;
  cy: number;
  /** ellipse radii as fraction of screen width / height */
  rxPct: number;
  ryPct: number;
  colorIndex: number;
  opacity: number;
};

export type MeshGradientConfig = {
  /** 4–7 hex colors referenced by blob colorIndex */
  colors: string[];
  baseColor: string;
  blurIntensity: number;
  blurIntensityAndroid?: number;
  /** 0–1 black veil after blur (readability) */
  overlayOpacity: number;
  blobs: MeshBlob[];
  blurTint: 'dark' | 'light' | 'default';
};

/** deep-merge partial config onto a full preset */
export function mergeMeshGradientConfig(
  base: MeshGradientConfig,
  partial?: Partial<MeshGradientConfig>,
): MeshGradientConfig {
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    colors: partial.colors ?? base.colors,
    blobs: partial.blobs ?? base.blobs,
  };
}

/**
 * cold green / blue mesh: strong top-center “light leak”, fades to deep blue-black.
 * mimics soft mesh apps: glow at top center, heavy blur, low contrast.
 */
export const MESH_GRADIENT_PRESET_COOL_TOP_GLOW: MeshGradientConfig = {
  colors: [
    '#2C442D', // desaturated cyan-teal (top-center glow)
    '#1F2E2A', // teal mid
    '#1F2E2A', // slate blue-green
    '#1F2E2A', // deep slate teal
    '#191D21', // blue-black shadow
    '#0F110E', // near-black with blue bias
  ],
  baseColor: '#0F110E',
  blurIntensity: 78,
  blurIntensityAndroid: 52,
  overlayOpacity: 0.1,
  blurTint: 'dark',
  blobs: [
    // primary top-center glow (wide ellipse — reads like the reference “top center” focal point)
    { cx: 0.5, cy: 0.09, rxPct: 0.95, ryPct: 0.52, colorIndex: 0, opacity: 0.92 },
    { cx: 0.15, cy: 0.22, rxPct: 0.55, ryPct: 0.4, colorIndex: 1, opacity: 0.55 },
    { cx: 0.85, cy: 0.2, rxPct: 0.52, ryPct: 0.38, colorIndex: 2, opacity: 0.48 },
    { cx: 0.5, cy: 0.48, rxPct: 0.88, ryPct: 0.55, colorIndex: 3, opacity: 0.58 },
    { cx: 0.35, cy: 0.78, rxPct: 0.7, ryPct: 0.45, colorIndex: 4, opacity: 0.65 },
    { cx: 0.82, cy: 0.82, rxPct: 0.58, ryPct: 0.42, colorIndex: 5, opacity: 0.55 },
  ],
};
