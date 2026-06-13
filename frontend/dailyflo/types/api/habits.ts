/**
 * habits API types — match GET/POST /habits/* camelCase responses from django.
 */

export type HabitTrackingType = 'binary' | 'numeric';

export type HabitFrequencyType =
  | 'daily'
  | 'weekly'
  | 'weekdays'
  | 'weekends'
  | 'custom'
  | 'times_per_week';

export type HabitColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'teal' | 'orange';

export interface HabitFrequencyConfig {
  dayOfWeek?: number;
  day_of_week?: number;
  days?: number[];
  targetCount?: number;
  target_count?: number;
}

export interface Habit {
  id: string;
  title: string;
  iconKey: string;
  color: HabitColor;
  trackingType: HabitTrackingType;
  targetValue: number | null;
  unitLabel: string;
  frequencyType: HabitFrequencyType;
  frequencyConfig: HabitFrequencyConfig;
  reminderTime: string;
  sortOrder: number;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HabitTodayItem {
  id: string;
  title: string;
  iconKey: string;
  color: HabitColor;
  trackingType: HabitTrackingType;
  targetValue: number | null;
  loggedValue: number;
  unitLabel: string;
  isCompleteToday: boolean;
  currentStreak: number;
  longestStreak: number;
  frequencyType: HabitFrequencyType;
}

export interface HabitsTodaySummary {
  scheduledCount: number;
  completedCount: number;
  bestActiveStreak: number;
}

export interface HabitsTodayResponse {
  date: string;
  summary: HabitsTodaySummary;
  habits: HabitTodayItem[];
}

export interface CreateHabitInput {
  title: string;
  iconKey?: string;
  color?: HabitColor;
  trackingType?: HabitTrackingType;
  targetValue?: number | null;
  unitLabel?: string;
  frequencyType?: HabitFrequencyType;
  frequencyConfig?: HabitFrequencyConfig;
  reminderTime?: string;
}

export interface UpdateHabitInput {
  title?: string;
  iconKey?: string;
  color?: HabitColor;
  trackingType?: HabitTrackingType;
  targetValue?: number | null;
  unitLabel?: string;
  frequencyType?: HabitFrequencyType;
  frequencyConfig?: HabitFrequencyConfig;
  reminderTime?: string;
  isActive?: boolean;
}

export interface HabitLogResponse {
  id: string;
  completionDate: string;
  loggedValue: number;
  isComplete: boolean;
  isCompleteToday: boolean;
  currentStreak: number;
  longestStreak: number;
  targetValue: number | null;
}

export interface HabitHeatmapData {
  startDate: string;
  days: number;
  completedDates: string[];
}

export interface HabitTrendPoint {
  date: string;
  rolling7DayRate: number;
}

export interface HabitTrendData {
  windowDays: number;
  points: HabitTrendPoint[];
}

export interface HabitStatsResponse {
  currentStreak: number;
  longestStreak: number;
  heatmap: HabitHeatmapData;
  trend: HabitTrendData;
}
