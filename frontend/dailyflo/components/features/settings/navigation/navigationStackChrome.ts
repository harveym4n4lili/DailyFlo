import { Platform } from 'react-native';

import type { useThemeColors } from '@/hooks/useColorPalette';

/** ios header + toolbar chrome for pushed navigation settings screens (back chevron) — same stack as settings index */
export function navigationPushStackOptions(themeColors: ReturnType<typeof useThemeColors>) {
  return Platform.OS === 'ios'
    ? {
        headerShown: true as const,
        headerTransparent: true as const,
        headerTitle: '',
        headerShadowVisible: false as const,
        headerBackVisible: false as const,
        contentStyle: { backgroundColor: themeColors.background.primary() },
      }
    : {
        headerShown: false as const,
      };
}
