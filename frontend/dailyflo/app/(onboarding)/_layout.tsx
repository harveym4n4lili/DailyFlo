/**
 * onboarding stack — `auth/` and `slides/` use folder + `index` only, so routes are `auth/index` and `slides/index`.
 * no `index` at group root: default screen is `auth/index` (`initialRouteName`) so we never `<Redirect>` through an extra route.
 */

import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { OnboardingSlidesInitialHeader } from '@/components/features/onboarding';

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

const SLIDES_HEADER_OPTIONS = {
  title: '',
  headerBackVisible: true,
  headerShown: true,
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent' },
  headerLeft: () => null,
  headerRight: () => null,
  headerTitle: () => <OnboardingSlidesInitialHeader />,
} as const;

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
      initialRouteName="auth/index"
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
      <Stack.Screen name="auth/index" options={{ headerShown: false }} />
      <Stack.Screen name="slides/index" options={SLIDES_HEADER_OPTIONS} />
    </Stack>
  );
}
