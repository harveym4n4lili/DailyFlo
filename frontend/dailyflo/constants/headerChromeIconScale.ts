/**
 * single source of truth for header / toolbar chrome sizes (glyph + hit targets).
 * values mirror HeaderIconButton so ActionContextMenu ellipsis matches bell/settings/dashboard.
 * exported as functions so we can later multiply by PixelRatio or read from design tokens without changing call sites.
 */

/** drawable size for vector icons in the chrome row (e.g. ellipsis stroke box) */
export function headerChromeIconSizePx(): number {
  return 24;
}

/** full circular glass / touch target for a standalone chrome control (ios Menu host + android circle) */
export function headerChromeActionMenuTriggerSizePx(): number {
  return 44;
}

/** minimum box when the trigger is icon-only (noWrapper / noGlass): still tappable, no extra chrome */
export function headerChromeIconOnlyBoxPx(): number {
  return 28;
}
