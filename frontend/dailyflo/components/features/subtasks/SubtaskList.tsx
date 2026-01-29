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
import { Platform } from 'react-native';

// UI COMPONENTS IMPORTS
// GroupedList: flexible iOS-style grouped list component
import { GroupedList } from '@/components/ui/List/GroupedList';

// EXPO GLASS EFFECT IMPORTS
// glass view: native ios uivisualeffectview liquid glass surface for the subtask card
// isGlassEffectAPIAvailable: runtime check so we only use glass when the api exists
import GlassView from 'expo-glass-effect/build/GlassView';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

// CUSTOM HOOKS IMPORTS
// useThemeColors: hook for accessing theme-aware colors
import { useThemeColors } from '@/hooks/useColorPalette';

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

  /**
   * Optional background color for the grouped list item wrappers (passed to GroupedList)
   */
  backgroundColor?: string;

  /**
   * Optional border radius for the grouped list (defaults to 24 when not provided)
   */
  borderRadius?: number;

  /**
   * Optional border width for the grouped list item wrappers
   */
  borderWidth?: number;

  /**
   * Optional border color for the grouped list item wrappers
   */
  borderColor?: string;
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
  backgroundColor,
  borderRadius = 24,
  borderWidth,
  borderColor,
}) => {
  // get theme-aware colors so the glass tint matches the rest of the ui
  const themeColors = useThemeColors();

  // helper to get ios major version so we only enable glass on ios 15+
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // platform.version can be "15.0" (string) or 15 (number)
    // here we always convert it to a whole number like 15, 16, 17
    const majorVersion =
      typeof version === 'string'
        ? parseInt(version.split('.')[0], 10)
        : Math.floor(version as number);
    return majorVersion;
  };

  // true when we are on ios 15+ (newer glass ui)
  const isNewerIOS = getIOSVersion() >= 15;

  // check if liquid glass api is available at runtime (prevents crashes on some betas)
  const glassAvailable = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  // shared grouped list content so we can render it inside or outside glass
  // pass through list styling props from parent (e.g. TaskCreationContent)
  const listContent = (
    <GroupedList
      borderRadius={borderRadius}
      backgroundColor={backgroundColor}
      borderWidth={borderWidth}
      borderColor={borderColor}
    >
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

  // when glass is available on newer ios we wrap the entire grouped list
  // inside a glassview so the subtasks feel like a single glass card
  if (isNewerIOS && glassAvailable) {
    return (
      <GlassView
        // use same border radius as grouped list so glass card matches
        style={{
          borderRadius,
          overflow: 'hidden',
        }}
        // use "clear" for a subtle glass effect for now
        glassEffectStyle="regular"
        tintColor={themeColors.background.primarySecondaryBlend() as any}
        isInteractive
      >
        {listContent}
      </GlassView>
    );
  }

  return (
    // fallback for android, web, and older ios: plain groupedlist as before
    listContent
  );
};

export default SubtaskList;

