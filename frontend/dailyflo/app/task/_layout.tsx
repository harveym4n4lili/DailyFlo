/**
 * Task – layout for the create-task form (root-level route).
 * Screen options (formSheet) are set on the root Stack in _layout.tsx.
 * Picker screens (date-select, time-duration-select, alert-select) are also root-level.
 * Draft shared via CreateTaskDraftProvider in root _layout.
 */

import React from 'react';
import { Slot } from 'expo-router';

export default function TaskLayout() {
  return <Slot />;
}
