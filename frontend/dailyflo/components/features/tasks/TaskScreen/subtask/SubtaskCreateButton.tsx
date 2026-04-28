/**
 * SubtaskCreateButton — NEW task creation only.
 * Uses same Checkbox component as SubtaskListItem (16px, matches TaskCard) + "Add subtask" text; icon and text use tertiary color.
 */

import React from 'react';
import { Text, Pressable, StyleSheet, View, Platform } from 'react-native';
import { getTypographyStyle } from '@/constants/Typography';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { Checkbox, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';

// match SubtaskListItem checkbox so the add row lines up visually (16px matches TaskCard)
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
  const typographyPlatform = Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
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
      <View style={styles.checkboxContainer}>
        <Checkbox checked={false} disabled />
      </View>
      <Text style={[getTypographyStyle('body-large', typographyPlatform), styles.label, { color: tertiaryColor }]}>
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
    paddingVertical: Paddings.none,
    paddingHorizontal: Paddings.none,
  },
  checkboxContainer: {
    width: CHECKBOX_SIZE_DEFAULT,
    height: CHECKBOX_SIZE_DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {},
});

export default SubtaskCreateButton;
