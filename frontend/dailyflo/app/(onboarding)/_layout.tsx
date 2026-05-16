/**
 * onboarding stack — `auth/` hides header (full-bleed landing); `slides/` shows back + progress chrome (no skip).
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
      <Stack.Screen name="index" options={{ headerShown: true,
        headerTransparent: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: 'transparent' },}} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      {/* full header is configured before questionnaire body mounts — avoids route title / empty bar flash */}
      <Stack.Screen
        name="slides"
        options={{
          title: '',
          headerBackVisible: true,
          headerShown: true,
          headerTransparent: true,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'transparent' },
          headerLeft: () => null,
          headerRight: () => null,
          headerTitle: () => <OnboardingSlidesInitialHeader />,
        }}
      />
      {/* slides inherits transparent header chrome above */}
    </Stack>
  );
}
