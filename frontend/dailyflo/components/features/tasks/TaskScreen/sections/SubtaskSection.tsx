/**
 * SubtaskSection Component
 *
 * Renders subtask list with GroupedList containing:
 * - SubtaskListItem components for each subtask
 * - SubtaskCreateButton for adding new subtasks
 * - Description component for task description
 */

import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GroupedList } from '@/components/ui/list/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { SubtaskCreateButton, SubtaskListItem } from '../subtask';
import { Description } from './Description';
import { useThemeColors } from '@/hooks/useColorPalette';
import type { Subtask } from '@/components/features/subtasks';
import type { TaskColor } from '@/types';

export interface SubtaskSectionProps {
  /** Array of subtasks to display */
  subtasks: Subtask[];
  
  /** Callback when a subtask title changes */
  onSubtaskTitleChange: (subtaskId: string, newTitle: string) => void;
  
  /** Callback when a subtask is toggled (complete/incomplete) */
  onSubtaskToggle: (subtaskId: string) => void;
  
  /** Callback when a subtask is deleted */
  onSubtaskDelete?: (subtaskId: string) => void;
  
  /** Callback when create subtask button is pressed */
  onCreateSubtask: () => void;
  
  /** When set, the subtask with this id should focus its input */
  pendingFocusSubtaskId?: string | null;
  
  /** Callback when the pending-focus subtask has focused its input */
  onClearPendingFocus?: () => void;
  
  /** Description value */
  description?: string;
  
  /** Callback when description changes */
  onDescriptionChange?: (description: string) => void;
  
  /** Task category color for styling */
  taskColor?: TaskColor;
  
  /** ScrollView ref for scrolling to end when subtask is focused */
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export const SubtaskSection: React.FC<SubtaskSectionProps> = ({
  subtasks,
  onSubtaskTitleChange,
  onSubtaskToggle,
  onSubtaskDelete,
  onCreateSubtask,
  pendingFocusSubtaskId,
  onClearPendingFocus,
  description = '',
  onDescriptionChange,
  taskColor = 'blue',
  scrollViewRef,
}) => {
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <GroupedList
        containerStyle={styles.subtaskListContainer}
        contentPaddingHorizontal={0}
       
        backgroundColor={'transparent'}
        separatorColor={themeColors.border.primary()}
        separatorInsetRight={Paddings.groupedListContentHorizontal}
        borderRadius={24}
        minimalStyle={false}
        fullWidthSeparators={false}
        separatorConsiderIconColumn={true}
        iconColumnWidth={26}
      >
        {subtasks.map((s) => (
          <SubtaskListItem
            key={s.id}
            value={s.title}
            onChangeText={(t) => onSubtaskTitleChange(s.id, t)}
            isCompleted={s.isCompleted}
            onToggleComplete={() => onSubtaskToggle(s.id)}
            placeholder="Subtask"
            onFocus={() => scrollViewRef?.current?.scrollToEnd({ animated: true })}
            onDelete={onSubtaskDelete ? () => onSubtaskDelete(s.id) : undefined}
            shouldAutoFocus={s.id === pendingFocusSubtaskId}
            onDidAutoFocus={onClearPendingFocus}
          />
        ))}
        <SubtaskCreateButton onPress={onCreateSubtask} />
        <Description
          description={description}
          onDescriptionChange={onDescriptionChange}
          isEditing={true}
          taskColor={taskColor}
        />
      </GroupedList>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    
  },
  subtaskListContainer: {
    marginVertical: 0,
  },
});

export default SubtaskSection;
