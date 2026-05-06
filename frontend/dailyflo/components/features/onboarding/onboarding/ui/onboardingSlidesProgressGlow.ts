/** builds vertical glow stops from the theme fill hue — avoids extra color deps */

function clampChannel(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function parseRgbHex(hex: string): readonly [number, number, number] | null {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g).toString(16).padStart(2, '0')}${clampChannel(b)
    .toString(16)
    .padStart(2, '0')}`;
}

function mix(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
): [number, number, number] {
  const l = (i: number) => from[i] + (to[i] - from[i]) * t;
  return [l(0), l(1), l(2)];
}

export type OnboardingSlidesProgressGlow = {
  colors: readonly string[];
  locations: readonly number[];
};

/**
 * bottom is slightly deepened; highlights stack toward the top so the pill reads like light rising upward.
 * paired with `LinearGradient` start at bottom / end at top in `OnboardingSlidesProgressBar`.
 */
export function onboardingProgressGlowStops(fillColorHex: string): OnboardingSlidesProgressGlow {
  const base = parseRgbHex(fillColorHex);
  if (!base) {
    return { colors: [fillColorHex, fillColorHex], locations: [0, 1] };
  }
  const floor = rgbHex(...mix(base, [0, 0, 0], 0.2));
  const lift = rgbHex(...mix(base, [255, 255, 255], 0.12));
  const body = rgbHex(...mix(base, [255, 255, 255], 0.26));
  const rise = rgbHex(...mix(base, [255, 255, 255], 0.36));
  const crest = rgbHex(...mix(base, [255, 255, 255], 0.5));
  return {
    colors: [floor, lift, body, rise, crest],
    locations: [0, 0.22, 0.48, 0.76, 1],
  };
}
