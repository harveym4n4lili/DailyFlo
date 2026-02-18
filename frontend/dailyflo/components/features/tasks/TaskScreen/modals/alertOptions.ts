/**
 * Alert options for task reminders.
 * Shared by the alert-select stack screen and any other alert picker UI.
 */

export interface AlertOption {
  id: string;
  label: string;
  value: number; // minutes before (0 = start, -1 = end, positive = minutes before)
  icon: string;
}

export const ALERT_OPTIONS: AlertOption[] = [
  { id: 'start', label: 'Start of task', value: 0, icon: 'play-outline' },
  { id: 'end', label: 'End of task', value: -1, icon: 'stop-outline' },
  { id: '15-min', label: '15 minutes before', value: 15, icon: 'alarm-outline' },
];
