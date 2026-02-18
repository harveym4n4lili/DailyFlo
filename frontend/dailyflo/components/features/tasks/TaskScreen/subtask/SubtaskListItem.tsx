/**
 * SubtaskListItem — NEW task creation only.
 * One row: 16px checkbox (matches TaskCard), 10px gap, text input. Vertical padding matches GroupedList content row (14px).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { TrashIcon, SFSymbolIcon } from '@/components/ui/icon';
import Checkbox from '@/components/ui/button/Checkbox/Checkbox';
import { Paddings } from '@/constants/Paddings';
// checkbox size matches TaskCard checkbox size (16px)
const CHECKBOX_SIZE = 16;
// spacing between checkbox (icon) and text input — matches SubtaskCreateButton icon–text gap
const ICON_TEXT_GAP = 10;
const TRASH_ICON_SIZE = 20;

export interface SubtaskListItemProps {
  /** current title value */
  value: string;
  /** called when text changes */
  onChangeText: (text: string) => void;
  /** whether this subtask is completed */
  isCompleted: boolean;
  /** called when checkbox is pressed to toggle completion */
  onToggleComplete: () => void;
  /** placeholder when value is empty */
  placeholder?: string;
  /** optional callback when input is focused */
  onFocus?: () => void;
  /** optional callback when input is blurred */
  onBlur?: () => void;
  /** whether the item is disabled */
  disabled?: boolean;
  /** called when the trash (delete) button is pressed */
  onDelete?: () => void;
  /** when true, focus the input after mount (e.g. after Add subtask); then call onDidAutoFocus */
  shouldAutoFocus?: boolean;
  /** called after auto-focus is done (used to clear pending focus id in parent) */
  onDidAutoFocus?: () => void;
}

export const SubtaskListItem: React.FC<SubtaskListItemProps> = ({
  value,
  onChangeText,
  isCompleted,
  onToggleComplete,
  placeholder = 'Subtask',
  onFocus,
  onBlur,
  disabled = false,
  onDelete,
  shouldAutoFocus = false,
  onDidAutoFocus,
}) => {
  const themeColors = useThemeColors();
  const inputRef = useRef<TextInput>(null);

  // when parent requests focus (e.g. after Add subtask), focus input and open keyboard after mount
  useEffect(() => {
    if (!shouldAutoFocus) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      onDidAutoFocus?.();
    }, 100);
    return () => clearTimeout(t);
  }, [shouldAutoFocus, onDidAutoFocus]);

  // handle checkbox press with haptic feedback
  const handleCheckboxPress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleComplete();
  };

  const placeholderColor = themeColors.text.tertiary();

  return (
    <View style={styles.row}>
      {/* checkbox on the left - using new Checkbox component */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          checked={isCompleted}
          onPress={handleCheckboxPress}
          size={CHECKBOX_SIZE}
          disabled={disabled}
        />
      </View>

      {/* gap then flexible text input */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        onFocus={onFocus}
        onBlur={onBlur}
        editable={!disabled}
        style={[getTextStyle('body-large'), styles.input, { color: themeColors.text.primary() }]}
        selectionColor="white"
        cursorColor="white"
        multiline={false}
        returnKeyType="done"
      />
      {/* trash (delete) button to the right of the input */}
      {onDelete && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.deleteButton}
        >
          <SFSymbolIcon
            name="trash.fill"
            size={TRASH_ICON_SIZE}
            color={themeColors.text.tertiary()}
            fallback={<TrashIcon size={TRASH_ICON_SIZE} color={themeColors.text.tertiary()} />}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Paddings.none,
    gap: ICON_TEXT_GAP,
  },
  // checkbox container - provides proper alignment and spacing
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: Paddings.none,
    minHeight: 22,
  },
  deleteButton: {
    padding: Paddings.none,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubtaskListItem;
