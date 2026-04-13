/**
 * Task – inner stack for /task/index (redirect) and /task/[taskId] (edit).
 * use Stack (not Slot): Slot can leave multiple child natives mounted; RNScreens formSheet
 * then warns "expects at most 2 subviews" on RNSSafeAreaView and layout/content breaks.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function TaskLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
        contentStyle: { flex: 1 },
      }}
    />
  );
}
