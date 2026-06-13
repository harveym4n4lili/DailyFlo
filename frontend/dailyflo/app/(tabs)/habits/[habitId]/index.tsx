/**
 * habit detail route — stack push from habits list row.
 */

import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { MainBackButton } from '@/components/ui/Button';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { HabitDetailScreenContent } from '@/components/features/habits/detail/HabitDetailScreenContent';
import { Paddings } from '@/constants/Paddings';

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const router = useGuardedRouter();
  const insets = useSafeAreaInsets();

  if (!habitId || typeof habitId !== 'string') return null;

  return (
    <>
      <IosBrowseBackStackToolbar />
      <View style={styles.screen}>
        {Platform.OS === 'android' ? (
          <View style={[styles.androidBar, { paddingTop: insets.top + 8 }]}>
            <MainBackButton onPress={() => router.back()} />
          </View>
        ) : null}
        <HabitDetailScreenContent habitId={habitId} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  androidBar: {
    paddingHorizontal: Paddings.screen,
    paddingBottom: 4,
  },
});
