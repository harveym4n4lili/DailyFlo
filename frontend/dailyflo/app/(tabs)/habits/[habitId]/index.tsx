/**
 * habit detail route — stack push from habits list row.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { HabitDetailScreenContent } from '@/components/features/habits/detail/HabitDetailScreenContent';

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();

  if (!habitId || typeof habitId !== 'string') return null;

  return (
    <>
      <IosBrowseBackStackToolbar />
      <View style={styles.screen}>
        <HabitDetailScreenContent habitId={habitId} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
