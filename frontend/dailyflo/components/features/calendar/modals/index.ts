/**
 * Calendar Modals
 * 
 * Barrel export file for calendar modal components.
 * This allows clean imports like: import { DatePickerModal } from '@/components/features/calendar/modals'
 */

// export the date picker modal component
export { DatePickerModal } from './DatePickerModal';
export type { DatePickerModalProps } from './DatePickerModal';

// export the calendar navigation modal component
export { CalendarNavigationModal } from './CalendarNavigationModal';
export type { CalendarNavigationModalProps } from './CalendarNavigationModal';

// default export for convenience (DatePickerModal)
export { DatePickerModal as default } from './DatePickerModal';

