/**
 * achievements filter — uses LiquidGlassSegmentedPicker (day-picker doc pattern on ios).
 */

import React from 'react';

import { LiquidGlassSegmentedPicker } from '@/components/ui/LiquidGlassSegmentedPicker';
import {
  ACHIEVEMENT_FILTER_OPTIONS,
  type AchievementFilterPickerProps,
} from './achievementFilterTypes';

export function AchievementFilterPicker({ value, onValueChange }: AchievementFilterPickerProps) {
  return (
    <LiquidGlassSegmentedPicker
      options={ACHIEVEMENT_FILTER_OPTIONS}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
