/**
 * Habit detail — full-screen formSheet on the root Stack (sibling to tabs), not nested under the habits tab stack.
 * thin route wrapper: resolves habitId from params/path, never returns null (empty formSheet looks broken).
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, usePathname } from 'expo-router';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { HabitDetailScreenContent } from './HabitDetailScreenContent';

function normalizeRouteParam(id: string | string[] | undefined): string | undefined {
  if (id == null) return undefined;
  return typeof id === 'string' ? id : id[0];
}

// expo-router sometimes leaves params empty for one frame on formSheet; path is still /habit/<id>
function habitIdFromHabitPath(pathname: string | undefined): string | undefined {
  if (!pathname) return undefined;
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'habit' || parts.length < 2) return undefined;
  try {
    const id = decodeURIComponent(parts[1]);
    return id || undefined;
  } catch {
    return parts[1] || undefined;
  }
}

export default function HabitDetailModalScreen() {
  const router = useGuardedRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ habitId: string }>();
  const themeColors = useThemeColors();

  const habitId =
    normalizeRouteParam(params.habitId as string | string[] | undefined) ??
    habitIdFromHabitPath(pathname);

  if (!habitId) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: themeColors.background.primary() }]}>
        <ActivityIndicator size="large" color={themeColors.primaryButton.fill()} />
      </View>
    );
  }

  return <HabitDetailScreenContent habitId={habitId} onClose={() => router.back()} />;
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
