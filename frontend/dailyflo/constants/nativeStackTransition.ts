/**
 * native-stack `animation` for expo-router Stack screens (react-native-screens under the hood).
 * used for task-selection pushes so they can differ from the default horizontal slide.
 *
 * other values you can try on ios: 'default' | 'fade' | 'simple_push' | 'slide_from_right' |
 * 'slide_from_left' | 'slide_from_bottom' | 'flip' | 'none'
 * android also supports e.g. 'fade_from_bottom', 'slide_from_bottom' — see native-stack docs.
 */
export const TASK_SELECTION_STACK_ANIMATION = 'fade' as const;

/** liquid tab pill + overlay FAB — duration aligned with iOS stack fade so chrome eases out with the transition */
export const IOS_LIQUID_CHROME_TRANSITION_MS = 320;
