/**
 * SubtaskCreateButton — NEW task creation only.
 * Brackets icon (18px) + "Add subtask" text; icon and text use tertiary color. No background, no inner padding.
 */

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { BracketsIcon } from '@/components/ui/Icon';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';

const ICON_SIZE = 16;
const ICON_GAP = 8;
// top padding so the button doesn't touch the top border of its grouped list row (matches list row content padding)
const CONTENT_PADDING_TOP = 14;

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
      <BracketsIcon size={ICON_SIZE} color={tertiaryColor} isSolid />
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
    gap: ICON_GAP,
    paddingTop: CONTENT_PADDING_TOP,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  label: {
    fontWeight: '700',
  },
});

export default SubtaskCreateButton;
