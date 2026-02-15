/**
 * SubtaskCreateButton — NEW task creation only.
 * Uses same Checkbox component as SubtaskListItem (16px, matches TaskCard) + "Add subtask" text; icon and text use tertiary color.
 */

import React from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { getTextStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import Checkbox from '@/components/ui/button/Checkbox/Checkbox';

// match SubtaskListItem checkbox so the add row lines up visually (16px matches TaskCard)
const CHECKBOX_SIZE = 16;
const ICON_TEXT_GAP = 10;
// no extra vertical padding
const CONTENT_PADDING_TOP = 0;

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
      {/* same Checkbox component as SubtaskListItem for visual consistency - always unchecked */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          checked={false}
          onPress={() => {}} // no-op since this is just a visual indicator
          size={CHECKBOX_SIZE}
          disabled={true} // disabled so it doesn't respond to taps (button handles press)
        />
      </View>
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
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '700',
  },
});

export default SubtaskCreateButton;
