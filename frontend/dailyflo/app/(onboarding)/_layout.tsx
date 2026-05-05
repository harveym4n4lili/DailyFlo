/**
 * onboarding stack — transparent native header; `introductory/` (dots), `slides/` (back + progress).
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

const IOS_ONBOARDING_SCROLL_EDGE_HIDDEN = {
  top: 'hidden' as const,
  bottom: 'hidden' as const,
  left: 'hidden' as const,
  right: 'hidden' as const,
};

function TransparentHeaderBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'transparent' }]} />
  );
}

export default function OnboardingLayout() {
  const iosHeaderNoChromeFade =
    Platform.OS === 'ios'
      ? ({
          headerBlurEffect: 'none' as const,
          headerLargeTitle: false,
          headerLargeTitleShadowVisible: false,
          scrollEdgeEffects: IOS_ONBOARDING_SCROLL_EDGE_HIDDEN,
        } as const)
      : {};

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: 'transparent' },
        headerBackground: () => <TransparentHeaderBackground />,
        headerTitleAlign: 'center',
        animation: 'default',
        gestureEnabled: false,
        contentStyle: { backgroundColor: 'transparent' },
        headerBackVisible: false,
        ...iosHeaderNoChromeFade,
      }}
    >
      {/* redirect-only route — suppress header so onboarding never flashes chrome here */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* introductory + slides screens inherit transparent header */}
    </Stack>
  );
}
