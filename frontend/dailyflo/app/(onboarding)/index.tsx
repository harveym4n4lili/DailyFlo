/**
 * Onboarding entry screen (v2 — single step to extend later).
 * root `app/_layout` sends new users here until onboarding is marked complete in AsyncStorage.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { ContinueButton } from '@/components/ui/Button';

// must stay in sync with `app/_layout.tsx` gate
const ONBOARDING_COMPLETE_KEY = '@DailyFlo:onboardingComplete';

export default function OnboardingScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors, typography, insets);

  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.error('onboarding: failed to persist completion', e);
      router.replace('/(tabs)');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.middle}>
        <Text style={styles.title}>Dailyflo</Text>
        <Text style={styles.body}>
          New onboarding flow — add steps and content here when you are ready.
        </Text>
      </View>

      {/* ContinueButton pins to screen edges (parent is full-bleed); uses Paddings.screen + safe area */}
      <ContinueButton onPress={finish} loading={busy} accessibilityLabel="Continue into the app" />
    </View>
  );
}

function createStyles(
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: themeColors.background.primary(),
      paddingTop: insets.top,
      // no horizontal padding here — ContinueButton’s absolute right uses Paddings.screen from the screen edge
      overflow: 'visible',
    },
    middle: {
      flex: 1,
      gap: 12,
      paddingHorizontal: Paddings.screen,
    },
    title: {
      ...typography.getTextStyle('heading-1'),
      color: themeColors.text.primary(),
      fontSize: 40,
    },
    body: {
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.secondary(),
      lineHeight: 24,
    },
  });
}
