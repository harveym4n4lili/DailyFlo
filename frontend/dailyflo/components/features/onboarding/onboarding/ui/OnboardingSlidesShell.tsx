/**
 * body shell under the native transparent stack header (back + progress + skip).
 * offsets body with `useHeaderHeight()` + `ONBOARDING_GAP_BELOW_HEADER` (same px as auth `AUTH_GAP_BELOW_HEADER`, see onboarding/constants/pagerLayout).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

import { ONBOARDING_GAP_BELOW_HEADER } from '../constants/pagerLayout';

export type OnboardingSlidesShellProps = {
  children: React.ReactNode;
  /**
   * when the continue row lives in a sibling below this shell, we normally pad the bottom so body content clears it.
   * set true on steps where body should meet that footer flush (debug / tight layouts).
   */
  flushBottomWithExternalFooter?: boolean;
};

export function OnboardingSlidesShell({
  children,
  flushBottomWithExternalFooter = false,
}: OnboardingSlidesShellProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const bottomPadding = Math.max(insets.bottom, Paddings.screen) + 48;

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + ONBOARDING_GAP_BELOW_HEADER,
            paddingHorizontal: Paddings.screen + Paddings.touchTarget,
            paddingBottom: flushBottomWithExternalFooter ? 0 : bottomPadding,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
