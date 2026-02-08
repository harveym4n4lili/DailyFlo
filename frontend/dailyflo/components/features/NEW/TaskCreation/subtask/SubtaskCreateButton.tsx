/**
 * SubtaskCreateButton — NEW task creation only.
 * Same unchecked checkbox circle as SubtaskListItem (14px) + "Add subtask" text; icon and text use tertiary color.
 */

import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';

// match SubtaskListItem checkbox so the add row lines up visually
const CHECKBOX_SIZE = 14;
const ICON_TEXT_GAP = 10;
// top padding so the button doesn't touch the top border of its grouped list row (matches list row content padding)
const CONTENT_PADDING_TOP = 16;

export interface SubtaskCreateButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export const SubtaskCreateButton: React.FC<SubtaskCreateButtonProps> = ({
  onPress,
  disabled = false,
}) => {
  const themeColors = useThemeColors();
  const tertiaryColor = themeColors.text.tertiary();

  const handlePress = () => {
    if (!disabled && onPress) onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      {/* same unchecked checkbox circle as SubtaskListItem for visual consistency */}
      <View style={[styles.checkboxCircle, { borderColor: tertiaryColor }]} />
      <Text style={[getTextStyle('body-large'), styles.label, { color: tertiaryColor }]}>
        Add subtask
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ICON_TEXT_GAP,
    paddingVertical: CONTENT_PADDING_TOP,
    paddingHorizontal: 0,
  },
  checkboxCircle: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: CHECKBOX_SIZE / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  label: {
    fontWeight: '700',
  },
});

export default SubtaskCreateButton;
