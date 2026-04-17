/**
 * browse stack scroll content top padding: matches today’s list — listcard uses paddingTop 64 + scrollPastTopInset,
 * so flatlist content gets safeAreaTop + 64 (same as blur strip height insets.top + 64).
 *
 * ios: pair with scrollview contentInsetAdjustmentBehavior="never" or uikit adds safe area again and the big title drops too far.
 */
const BELOW_TOP_CHROME = 64;

export function browseScrollPaddingTop(safeAreaTop: number): number {
  return safeAreaTop - BELOW_TOP_CHROME;
}
