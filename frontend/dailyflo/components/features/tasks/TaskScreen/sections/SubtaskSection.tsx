/**
 * SubtaskSection Component
 *
 * subtasks + description in one GroupedList card — same pattern as quick add (blend surface, solid separators, 24 radius).
 */

import React from 'react';
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

  /** optional GroupedList overrides (parent can tune; defaults match quick-add / FormDetailSection) */
  listBackgroundColor?: string;
  listBorderRadius?: number;
  listBorderWidth?: number;
  listBorderColor?: string;
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
  listBackgroundColor,
  listBorderRadius = 24,
  listBorderWidth,
  listBorderColor,
}) => {
  const themeColors = useThemeColors();
  // same opaque row background as quick-add GroupedList so the card reads as one surface (not transparent over scroll bg)
  const rowBackground =
    listBackgroundColor ?? themeColors.background.primarySecondaryBlend();

  return (
    <View style={styles.container}>
      <View style={[styles.subtaskGroupedCard, { borderRadius: listBorderRadius }]}>
        <GroupedList
          containerStyle={styles.subtaskListContainer}
          contentPaddingHorizontal={Paddings.groupedListContentHorizontal}
          contentPaddingVertical={Paddings.groupedListContentVertical}
          backgroundColor={rowBackground}
          separatorColor={themeColors.border.primary()}
          separatorInsetRight={Paddings.groupedListContentHorizontal}
          separatorVariant="solid"
          borderRadius={listBorderRadius}
          borderWidth={listBorderWidth}
          borderColor={listBorderColor}
          minimalStyle={false}
          fullWidthSeparators={false}
          separatorConsiderIconColumn={true}
          iconColumnWidth={30}
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
            isEditing
            taskColor={taskColor}
            showIcon
            useInitialMinHeight
            minVisibleLines={5}
          />
        </GroupedList>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 12 matches FormDetailSection repeatingRow marginTop (gap from date/time GroupedList to pills)
  container: {
    marginTop: 8,
  },
  // clips grouped corners; borderRadius set inline from listBorderRadius to stay in sync with GroupedList
  subtaskGroupedCard: {
    overflow: 'hidden',
  },
  subtaskListContainer: {
    marginVertical: 0,
  },
});

export default SubtaskSection;
