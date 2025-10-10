/**
 * DatePicker Components
 * 
 * Barrel export file for date picker related components.
 * This allows clean imports like: import { DatePickerModal, QuickDateOptions } from '@/components/features/calendar/DatePicker'
 */

// export the main date picker modal component
export { DatePickerModal } from './DatePickerModal';
export type { DatePickerModalProps } from './DatePickerModal';

// export the quick date options component
export { QuickDateOptions } from './QuickDateOptions';
export type { QuickDateOptionsProps } from './QuickDateOptions';

// export the calendar view component
export { CalendarView } from './CalendarView';
export type { CalendarViewProps } from './CalendarView';

// default export for convenience
export { DatePickerModal as default } from './DatePickerModal';

