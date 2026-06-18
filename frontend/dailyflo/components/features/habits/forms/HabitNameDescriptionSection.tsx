/**
 * habit name + description in one GroupedList card — mirrors TaskScreen SubtaskSection
 * (subtasks replaced by a plain name row with no leading icon).
 */

import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';

import { Description } from '@/components/features/tasks/TaskScreen/sections/Description';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';

type HabitNameDescriptionSectionProps = {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  autoFocusTitle?: boolean;
  /** remounts Description when edit screen hydrates API text into the field */
  descriptionInputKey?: string;
};

export function HabitNameDescriptionSection({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  autoFocusTitle = false,
  descriptionInputKey,
}: HabitNameDescriptionSectionProps) {
  const themeColors = useThemeColors();

  const titleInputStyle = useMemo(
    () => [
      getTextStyle('body-large'),
      {
        color: themeColors.text.primary(),
        flex: 1,
        minWidth: 0,
        paddingVertical: Paddings.none,
        paddingHorizontal: Paddings.none,
        margin: 0,
        ...(Platform.OS === 'android' && {
          includeFontPadding: false,
          textAlignVertical: 'center' as const,
        }),
      },
    ],
    [themeColors],
  );

  return (
    <View style={styles.groupedCard}>
      <GroupedList
        containerStyle={styles.listContainer}
        contentPaddingHorizontal={Paddings.groupedListContentHorizontal}
        contentPaddingVertical={Paddings.groupedListContentVertical}
        backgroundColor={themeColors.background.primarySecondaryBlend()}
        separatorColor={themeColors.border.primary()}
        separatorInsetRight={Paddings.groupedListContentHorizontal}
        separatorVariant="solid"
        borderRadius={Paddings.groupedListBorderRadius}
        minimalStyle={false}
        fullWidthSeparators={false}
        separatorConsiderIconColumn={false}
        contentMinHeight={0}
      >
        <View style={styles.nameRow}>
          <TextInput
            value={title}
            onChangeText={onTitleChange}
            placeholder="Name"
            placeholderTextColor={themeColors.text.tertiary()}
            selectionColor="#FFFFFF"
            cursorColor="#FFFFFF"
            selectionHandleColor="#FFFFFF"
            underlineColorAndroid="transparent"
            accessibilityLabel="Habit name"
            style={titleInputStyle}
            autoFocus={autoFocusTitle}
            returnKeyType="next"
          />
        </View>
        <Description
          key={descriptionInputKey}
          description={description}
          onDescriptionChange={onDescriptionChange}
          isEditing
          taskColor="green"
          useInitialMinHeight
          minVisibleLines={5}
        />
      </GroupedList>
    </View>
  );
}

const styles = StyleSheet.create({
  groupedCard: {
    overflow: 'hidden',
    borderRadius: Paddings.groupedListBorderRadius,
  },
  listContainer: {
    marginVertical: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
