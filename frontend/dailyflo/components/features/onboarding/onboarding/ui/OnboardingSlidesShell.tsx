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
  /**
   * when true, no horizontal inset on this wrapper — use for full-bleed scrollviews so the system scroll indicator sits on the screen edge; add `Paddings.screen` on the scroll body yourself.
   */
  omitHorizontalPadding?: boolean;
};

export function OnboardingSlidesShell({
  children,
  flushBottomWithExternalFooter = false,
  omitHorizontalPadding = false,
}: OnboardingSlidesShellProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const bottomPadding = Math.max(insets.bottom, Paddings.screen) + 48;
  // default questionnaire inset is screen + touch target; full-bleed scroll paths set omitHorizontalPadding and pad inside the scroll body instead
  const horizontalContentPad = omitHorizontalPadding ? 0 : Paddings.screen + Paddings.touchTarget;

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + ONBOARDING_GAP_BELOW_HEADER,
            paddingHorizontal: horizontalContentPad,
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
