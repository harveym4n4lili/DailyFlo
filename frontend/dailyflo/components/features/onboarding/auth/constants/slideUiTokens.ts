/**
 * auth landing — background + text + continue FAB tokens (single screen).
 */

import type { AuthSlideUiConfig } from './types';

export const AUTH_PAGE_SLIDE_UI: readonly AuthSlideUiConfig[] = [
  {
    // same surface as the rest of the app: `resolveIntroBackgroundColor` turns `primary` into `themeColors.background.primary()`
    background: 'primary',
    continueButtonBackground: 'marple:500',
  },
];
