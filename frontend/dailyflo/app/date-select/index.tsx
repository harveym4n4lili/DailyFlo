/**
 * Route: /date-select
 * Renders the date picker screen (QuickDateOptions + Calendar). Used from task form.
 */

import { DateSelectScreen } from '@/components/features/tasks/TaskScreen/modals';

export default function DateSelectRoute() {
  return <DateSelectScreen />;
}
