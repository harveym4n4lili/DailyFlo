/**
 * TaskOptionButton Component
 *
 * A simplified FormPickerButton for fields that have no value yet.
 * Used in a horizontal scroll at the bottom of GroupedList to let users add
 * options like Alerts, Time & Duration, etc. When tapped, opens the picker modal.
 * Once a value is selected, the field appears as a FormDetailButton with dynamic messaging.
 *
 * Unlike FormPickerButton, TaskOptionButton has:
 * - No dynamic messaging (displayText, defaultText, semantic colors)
 * - No hasValue-based styling (always shows the "add" pill style)
 * - Optional label (when omitted, icon-only with primary background, no content padding, 24px icon)
 *
 * Usage:
 * <TaskOptionButton
 *   icon="notifications-outline"
 *   label="Alerts"
 *   onPress={handleShowAlertsPicker}
 * />
 *
 * Or with custom icon:
 * <TaskOptionButton
 *   customIcon={<BellIcon size={18} color={themeColors.text.primary()} />}
 *   label="Alerts"
 *   onPress={handleShowAlertsPicker}
 * />
 */

import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';

export interface TaskOptionButtonProps {
  /**
   * Icon name from Ionicons (e.g., 'notifications-outline', 'time-outline')
   * Ignored when customIcon is provided.
   */
  icon?: string;

  /**
   * Optional label text. When omitted or empty, only the icon is shown.
   */
  label?: string;

  /**
   * Callback when button is pressed.
   * Opens the associated picker modal (Alert, TimeDuration, etc.).
   */
  onPress: () => void;

  /**
   * Whether the button is disabled.
   * @default false
   */
  disabled?: boolean;

  /**
   * Optional custom style for the button container.
   */
  containerStyle?: object;

  /**
   * Custom icon element (e.g. ClockIcon, BellIcon).
   * When provided, used instead of the icon prop.
   */
  customIcon?: React.ReactNode;

  /**
   * Background color for the button pill.
   * Defaults to theme background.primarySecondaryBlend (elevated, same as GroupedListItemWrapper) when not provided.
   */
  backgroundColor?: string;
}

const BORDER_RADIUS = 28; // pill shape (matches GroupedList default)
const ICON_SIZE = 18; // form option icon size
// match GroupedListItemWrapper content padding and min height for visual consistency
const CONTENT_PADDING_HORIZONTAL = 20;
const CONTENT_PADDING_VERTICAL = 14;
const CONTENT_MIN_HEIGHT = 44;

/**
 * TaskOptionButton Component
 *
 * Renders a simple pill button with icon + label. Used for fields with no value.
 * Tapping opens the picker; after selection, the field becomes a FormDetailButton row.
 * Padding and minHeight match GroupedListItemWrapper for consistent touch targets.
 */
export const TaskOptionButton: React.FC<TaskOptionButtonProps> = ({
  icon = 'add-outline',
  label,
  onPress,
  disabled = false,
  containerStyle,
  customIcon,
  backgroundColor: backgroundColorProp,
}) => {
  const themeColors = useThemeColors();

  const iconColor = themeColors.text.primary();
  const textColor = themeColors.text.primary();
  // elevated background: same as GroupedListItemWrapper when no override
  const backgroundColor = backgroundColorProp ?? themeColors.background.elevated();
  const showLabel = label != null && label.length > 0;

  return (
    <View style={[{ alignSelf: 'flex-start' }, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: showLabel ? 4 : 0,
          borderRadius: BORDER_RADIUS,
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingVertical: CONTENT_PADDING_VERTICAL,
          minHeight: CONTENT_MIN_HEIGHT,
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          {customIcon ?? (
            <Ionicons name={icon as any} size={ICON_SIZE} color={iconColor} />
          )}
        </View>
        {showLabel && (
          <Text
            style={[
              getTextStyle('body-large'),
              { color: textColor},
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default TaskOptionButton;
