/**
 * SubtaskListItem — NEW task creation only.
 * One row: 18px checkbox, 8px gap, text input. Vertical padding matches GroupedList content row (14px).
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Animated as RNAnimated,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { TrashIcon } from '@/components/ui/Icon';

// match header/button row vertical padding (same as SubtaskCreateButton top padding and header padding)
const CONTENT_PADDING_VERTICAL = 14;
const CHECKBOX_SIZE = 14;
// spacing between checkbox (icon) and text input — matches SubtaskCreateButton icon–text gap
const ICON_TEXT_GAP = 10;
const TRASH_ICON_SIZE = 18;

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

  // checkbox fill animation: 0 = unchecked (grey border, no fill), 1 = checked (primary fill)
  const checkboxFill = useRef(new RNAnimated.Value(isCompleted ? 1 : 0)).current;
  const checkboxScale = useRef(new RNAnimated.Value(1)).current;

  // when parent requests focus (e.g. after Add subtask), focus input and open keyboard after mount
  useEffect(() => {
    if (!shouldAutoFocus) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      onDidAutoFocus?.();
    }, 100);
    return () => clearTimeout(t);
  }, [shouldAutoFocus, onDidAutoFocus]);

  useEffect(() => {
    RNAnimated.timing(checkboxFill, {
      toValue: isCompleted ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isCompleted, checkboxFill]);

  const handleCheckboxPress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    RNAnimated.sequence([
      RNAnimated.timing(checkboxScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      RNAnimated.timing(checkboxScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    onToggleComplete();
  };

  const placeholderColor = themeColors.text.tertiary();

  return (
    <View style={styles.row}>
      {/* 18px checkbox on the left */}
      <TouchableOpacity
        onPress={handleCheckboxPress}
        disabled={disabled}
        activeOpacity={1}
        style={styles.checkboxTouchable}
      >
        <RNAnimated.View style={{ transform: [{ scale: checkboxScale }] }}>
          <RNAnimated.View
            style={[
              styles.checkboxCircle,
              {
                borderColor: checkboxFill.interpolate({
                  inputRange: [0, 1],
                  outputRange: [themeColors.text.tertiary(), themeColors.text.primary()],
                }),
                backgroundColor: checkboxFill.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['transparent', themeColors.text.primary()],
                }),
              },
            ]}
          />
        </RNAnimated.View>
      </TouchableOpacity>

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
        style={[getTextStyle('body-large'), styles.input, { color: themeColors.text.primary(), fontWeight: '900' }]}
        selectionColor={themeColors.text.primary()}
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
          <TrashIcon size={TRASH_ICON_SIZE} color={themeColors.text.tertiary()} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: CONTENT_PADDING_VERTICAL,
    gap: ICON_TEXT_GAP,
  },
  // checkbox tap area; no fixed height so row doesn’t get extra top/bottom space (tap area via padding)
  checkboxTouchable: {
    width: CHECKBOX_SIZE,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircle: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: CHECKBOX_SIZE / 2,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    padding: 0,
    minHeight: 22,
  },
  deleteButton: {
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubtaskListItem;
