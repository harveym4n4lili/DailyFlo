/**
 * SubtaskList Component
 * 
 * A component that renders a list of subtasks with a create button.
 * Wraps the GroupedList container that holds all subtask items.
 * 
 * Features:
 * - Renders all subtasks using SubtaskListItem components
 * - Create button always at the bottom
 * - Uses GroupedList for consistent styling
 */

// REACT IMPORTS
import React from 'react';

// UI COMPONENTS IMPORTS
// GroupedList: flexible iOS-style grouped list component
import { GroupedList } from '@/components/ui/List/GroupedList';

// SUBTASKS COMPONENTS IMPORTS
// SubtaskListItem: component for displaying individual subtasks
import { SubtaskListItem } from './SubtaskListItem';
// CreateSubtaskButton: button component for creating subtasks
import { CreateSubtaskButton } from './CreateSubtaskButton';

/**
 * Interface for a subtask item
 * This matches the structure used in TaskViewModal
 */
export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  isEditing?: boolean;
}

/**
 * Props interface for SubtaskList component
 */
export interface SubtaskListProps {
  /**
   * Array of subtasks to display
   * Each subtask has id, title, completion status, and optional editing state
   */
  subtasks: Subtask[];
  
  /**
   * Callback when a subtask is toggled (complete/incomplete)
   * Receives the subtask ID as parameter
   */
  onToggle: (subtaskId: string) => void;
  
  /**
   * Callback when a subtask is deleted
   * Receives the subtask ID as parameter
   */
  onDelete: (subtaskId: string) => void;
  
  /**
   * Callback when a subtask title changes
   * Receives the subtask ID and new title as parameters
   */
  onTitleChange: (subtaskId: string, newTitle: string) => void;
  
  /**
   * Callback when editing a subtask is finished
   * Receives the subtask ID as parameter
   */
  onFinishEditing: (subtaskId: string) => void;
  
  /**
   * Callback when create subtask button is pressed
   * This is where the parent component handles creating a new subtask
   */
  onCreateSubtask: () => void;
  
  /**
   * Whether the list is disabled
   */
  disabled?: boolean;
}

/**
 * SubtaskList Component
 * 
 * Renders a GroupedList containing all subtask items and a create button.
 * The create button is always positioned at the bottom of the list.
 */
export const SubtaskList: React.FC<SubtaskListProps> = ({
  subtasks,
  onToggle,
  onDelete,
  onTitleChange,
  onFinishEditing,
  onCreateSubtask,
  disabled = false,
}) => {
  return (
    <GroupedList borderRadius={24}>
      {/* render all subtasks */}
      {/* map through subtasks array and create a SubtaskListItem for each one */}
      {subtasks.map((subtask) => (
        <SubtaskListItem
          key={subtask.id}
          id={subtask.id}
          title={subtask.title}
          isCompleted={subtask.isCompleted}
          isEditing={subtask.isEditing}
          onPress={() => onToggle(subtask.id)}
          onDelete={() => onDelete(subtask.id)}
          onTitleChange={(newTitle) => onTitleChange(subtask.id, newTitle)}
          onFinishEditing={() => onFinishEditing(subtask.id)}
          disabled={disabled}
        />
      ))}
      
      {/* create subtask button - always at the bottom */}
      {/* this button allows users to add new subtasks to the list */}
      <CreateSubtaskButton onPress={onCreateSubtask} disabled={disabled} />
    </GroupedList>
  );
};

export default SubtaskList;

