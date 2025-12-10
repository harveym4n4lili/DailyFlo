/**
 * TaskViewModal
 * 
 * Orchestrator for the task view flow.
 * Handles modal visibility and delegates UI to TaskViewContent component.
 */

// REACT IMPORTS
// react: core react library for building components
import React from 'react';

// LAYOUT COMPONENTS IMPORTS
// Modal components: using composable approach with FullScreenModal
import { FullScreenModal } from '@/components/layout/ModalLayout';

// CUSTOM HOOKS IMPORTS
// hooks for accessing design system and theme
import { useThemeColors } from '@/hooks/useColorPalette';

// FEATURE COMPONENTS IMPORTS
// TaskViewContent: the actual content and UI for task view
import { TaskViewContent } from './TaskViewContent';

// TYPES IMPORTS
// typescript types for type safety
import type { TaskColor, Task } from '@/types';

/**
 * Props for the TaskViewModal component
 */
export interface TaskViewModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Task color for styling */
  taskColor?: TaskColor;
  
  /** Task ID to display (will be used to fetch task data) */
  taskId?: string;
  
  /** Task data (optional, if provided will be used instead of fetching) */
  task?: Task;
}

/**
 * TaskViewModal Component
 * 
 * Orchestrates the task view flow.
 * Manages modal visibility and renders backdrop + content.
 */
export function TaskViewModal({ 
  visible, 
  onClose,
  taskColor = 'blue',
  taskId,
  task,
}: TaskViewModalProps) {
  // HOOKS
  const themeColors = useThemeColors();

  // COMPONENT RENDER
  // using composable approach: FullScreenModal with task view content
  return (
    <FullScreenModal
      visible={visible}
      onClose={onClose}
      backgroundColor={themeColors.background.elevated()}
      showBackdrop={true}
      backdropDismiss={true}
    >
      <TaskViewContent
        visible={visible}
        onClose={onClose}
        taskColor={taskColor}
        taskId={taskId}
        task={task}
      />
    </FullScreenModal>
  );
}

export default TaskViewModal;

