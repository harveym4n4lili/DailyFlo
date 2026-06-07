/**
 * Habits tab root — same standalone shell as Today / AI (not a browse stack push).
 */

import React from 'react';
import { View } from 'react-native';

import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { HabitsScreenContent } from '@/components/features/habits';

export default function HabitsScreen() {
  return (
    <>
      <IosDashboardOverflowToolbar />
      <View style={{ flex: 1 }}>
        <HabitsScreenContent />
      </View>
    </>
  );
}
