/**
 * one intro carousel slide content shell (body area under the header).
 * bg is now owned by the parent screen so it can fade between pages without moving on horizontal scroll.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

const GAP_UNDER_HEADER_BAR = Paddings.screen;
const TITLE_BODY_HORIZONTAL_ALIGNMENT_OFFSET = 16;

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
            paddingTop: headerHeight + GAP_UNDER_HEADER_BAR,
            // keep body text aligned with the title overlay inset from `introductory/index.tsx`
            paddingHorizontal: Paddings.screen + TITLE_BODY_HORIZONTAL_ALIGNMENT_OFFSET,
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
