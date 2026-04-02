/**
 * Browse stack screens (inbox, tags, completed, list detail) use a fixed blur header + MainBackButton.
 * scrollContent used to use paddingTop: 64 only — that ignores safeAreaTop, so on a notch the button
 * sits around y ≈ safeAreaTop…safeAreaTop+45 while the big title still started at y=64 and drew *under* the button.
 * this helper keeps 64 on small/zero safe areas (same as before on Android) and grows on notched iPhones.
 */
const TOP_SECTION_ROW_HEIGHT = 0;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export function browseScrollPaddingTop(safeAreaTop: number): number {
  return Math.max(
    TOP_SECTION_ANCHOR_HEIGHT,
    safeAreaTop + TOP_SECTION_ROW_HEIGHT
  );
}
