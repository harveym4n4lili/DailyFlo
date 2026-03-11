/**
 * Today icon mapping – selects day-specific icon for the Today tab (e.g. today11.png for 11th).
 * Metro requires static require() paths, so we map each day that has a custom icon.
 * Add new entries as you create Today{N}.png assets (with @2x/@3x for retina).
 */

// map day of month (1–31) to icon – add entries as you create Today{N}.png files
const TODAY_ICONS_BY_DAY: Record<number, ReturnType<typeof require>> = {
  1: require('@/assets/icons/Today1.png'),
  2: require('@/assets/icons/Today2.png'),
  3: require('@/assets/icons/Today3.png'),
  11: require('@/assets/icons/Today11.png'),
};

// fallback when no day-specific icon exists
const TODAY_ICON_FALLBACK = require('@/assets/icons/Today.png');

/**
 * Returns the Today tab icon for the current day of the month.
 * Uses Today{N}.png when available, otherwise Today.png.
 */
export function getTodayTabIcon(): ReturnType<typeof require> {
  const day = new Date().getDate();
  return TODAY_ICONS_BY_DAY[day] ?? TODAY_ICON_FALLBACK;
}
