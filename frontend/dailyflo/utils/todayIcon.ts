/**
 * Today icon mapping – selects day-specific icon for the Today tab (e.g. today11.png for 11th).
 * Metro requires static require() paths, so we map each day that has a custom icon.
 * Add new entries as you create Today{N}.png assets (with @2x/@3x for retina).
 */

// map day of month (1–31) to icon – each day has its own Today{N}.png asset
const TODAY_ICONS_BY_DAY: Record<number, ReturnType<typeof require>> = {
  1: require('@/assets/icons/Today1.png'),
  2: require('@/assets/icons/Today2.png'),
  3: require('@/assets/icons/Today3.png'),
  4: require('@/assets/icons/Today4.png'),
  5: require('@/assets/icons/Today5.png'),
  6: require('@/assets/icons/Today6.png'),
  7: require('@/assets/icons/Today7.png'),
  8: require('@/assets/icons/Today8.png'),
  9: require('@/assets/icons/Today9.png'),
  10: require('@/assets/icons/Today10.png'),
  11: require('@/assets/icons/Today11.png'),
  12: require('@/assets/icons/Today12.png'),
  13: require('@/assets/icons/Today13.png'),
  14: require('@/assets/icons/Today14.png'),
  15: require('@/assets/icons/Today15.png'),
  16: require('@/assets/icons/Today16.png'),
  17: require('@/assets/icons/Today17.png'),
  18: require('@/assets/icons/Today18.png'),
  19: require('@/assets/icons/Today19.png'),
  20: require('@/assets/icons/Today20.png'),
  21: require('@/assets/icons/Today21.png'),
  22: require('@/assets/icons/Today22.png'),
  23: require('@/assets/icons/Today23.png'),
  24: require('@/assets/icons/Today24.png'),
  25: require('@/assets/icons/Today25.png'),
  26: require('@/assets/icons/Today26.png'),
  27: require('@/assets/icons/Today27.png'),
  28: require('@/assets/icons/Today28.png'),
  29: require('@/assets/icons/Today29.png'),
  30: require('@/assets/icons/Today30.png'),
  31: require('@/assets/icons/Today31.png'),
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
