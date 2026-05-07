/**
 * transparent native header tokens for the intro modal — kept on the root stack screen so there is no
 * nested stack here; nested stacks can swallow `router.push('/onboarding')` (nowhere to push inside inner stack).
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const IOS_INTRODUCTORY_SCROLL_EDGE_HIDDEN = {
  top: 'hidden' as const,
  bottom: 'hidden' as const,
  left: 'hidden' as const,
  right: 'hidden' as const,
};

export function IntroductoryTransparentHeaderBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent' }]} />
  );
}

const iosHeaderNoChromeFade =
  Platform.OS === 'ios'
    ? ({
        headerBlurEffect: 'none' as const,
        headerLargeTitle: false,
        headerLargeTitleShadowVisible: false,
        scrollEdgeEffects: IOS_INTRODUCTORY_SCROLL_EDGE_HIDDEN,
      } as const)
    : {};

/** merge into root `<Stack.Screen name="introductory" options={...} />` */
export const introductoryRootHeaderOptions = {
  headerShown: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent' },
  headerBackground: () => <IntroductoryTransparentHeaderBackground />,
  headerTitleAlign: 'center' as const,
  animation: 'default' as const,
  gestureEnabled: false,
  contentStyle: { backgroundColor: 'transparent' },
  headerBackVisible: false,
  ...iosHeaderNoChromeFade,
};
