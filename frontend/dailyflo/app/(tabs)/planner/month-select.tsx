/**
 * Route: (tabs)/planner/month-select
 * Renders the planner's month/day navigator as a stack screen modal on the planner stack.
 * Opened when the user taps the month/year display in the Planner tab.
 */

import { MonthSelectScreen } from '@/components/features/calendar/screens/MonthSelectScreen';

export default function PlannerMonthSelectRoute() {
  return <MonthSelectScreen />;
}
