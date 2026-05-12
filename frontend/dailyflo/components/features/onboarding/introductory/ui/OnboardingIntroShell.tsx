/**
 * one intro carousel slide content shell (body area under the header).
 * bg is now owned by the parent screen so it can fade between pages without moving on horizontal scroll.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

import { INTRO_GAP_BELOW_HEADER } from '../constants/pagerLayout';

export type OnboardingIntroShellProps = {
  children: React.ReactNode;
};

export function OnboardingIntroShell({ children }: OnboardingIntroShellProps) {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  // space for floating Continue plus home indicator safe area
  const bottomPadding = Math.max(insets.bottom, Paddings.screen) + 96;

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + INTRO_GAP_BELOW_HEADER,
            // `Paddings.screen` + `screenSmall` — same horizontal inset as `IntroScrollCrossfadeTitleLayer` and questionnaire shell
            paddingHorizontal: Paddings.screen + Paddings.screenSmall,
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
