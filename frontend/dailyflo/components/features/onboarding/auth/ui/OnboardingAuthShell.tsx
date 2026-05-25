/**
 * layout wrapper for auth landing body — no native header here, so top inset uses safe-area only.
 * horizontal inset matches `OnboardingSlidesShell` (one `screen + touchTarget` gutter only; `AuthLandingPage` must not add a second).
 * bottom pad clears the home indicator only — auth CTAs render in the route footer (`app/(onboarding)/auth`).
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

import { AUTH_GAP_BELOW_HEADER } from '../constants/pagerLayout';

export type OnboardingAuthShellProps = {
  children: React.ReactNode;
};

export function OnboardingAuthShell({ children }: OnboardingAuthShellProps) {
  const insets = useSafeAreaInsets();

  // safe-area bottom only — auth CTAs live in the route footer (`app/(onboarding)/auth`)
  const bottomPadding = Math.max(insets.bottom, Paddings.screen);

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + AUTH_GAP_BELOW_HEADER,
            paddingHorizontal: Paddings.screen + Paddings.touchTarget,
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
