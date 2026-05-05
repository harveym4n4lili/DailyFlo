/**
 * body shell under the native header — matches introductory OnboardingIntroShell spacing
 * so questionnaire slides line up with the intro funnel rhythm.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

const GAP_UNDER_HEADER_BAR = Paddings.screen;

export type OnboardingSlidesShellProps = {
  children: React.ReactNode;
};

export function OnboardingSlidesShell({ children }: OnboardingSlidesShellProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Paddings.screen) + 48;

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + GAP_UNDER_HEADER_BAR,
            paddingHorizontal: Paddings.screen,
            paddingBottom: bottomPadding,
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
