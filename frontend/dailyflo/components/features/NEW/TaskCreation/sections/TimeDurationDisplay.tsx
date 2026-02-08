/**
 * TimeDurationDisplay Section
 *
 * Displays the selected time and/or duration with dynamic messaging:
 * - No time, no duration: main "All day", sub "No duration"
 * - Time, no duration: main = time, sub "No duration"
 * - Time and duration: main "start - end", sub "Xmin"
 * Styled like GroupedListItemWrapper: same background, inner padding, border radius.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { ClockIcon } from '@/components/ui/Icon';
import { getTimeDurationDisplayLabels } from '@/components/ui/Button';

const ICON_SIZE = 18;
const INNER_RADIUS = 8; // corners nearest the other display when side by side
const OUTER_RADIUS = 28; // outer corners when side by side
const CONTENT_PADDING_HORIZONTAL = 16;
const CONTENT_PADDING_VERTICAL = 14;

export interface TimeDurationDisplayProps {
  /** Time string in HH:MM format (e.g. "14:30") or undefined when not set */
  time?: string;
  /** Duration in minutes or undefined when not set */
  duration?: number;
  /** When provided, the row is pressable and opens the time/duration picker */
  onPress?: () => void;
  /** When "left", use 28 on left corners and 12 on right (inner) corners for side-by-side layout */
  positionInRow?: 'left' | 'right';
}

/**
 * Renders a single row with elevated background, same padding and radius as grouped list items.
 * For now uses example text; will use getTimeDurationPickerDisplay when wired to form values.
 */
export const TimeDurationDisplay: React.FC<TimeDurationDisplayProps> = ({
  time,
  duration,
  onPress,
  positionInRow,
}) => {
  const themeColors = useThemeColors();
  const backgroundColor = themeColors.background.elevated();

  // dynamic labels: All day / No duration, time / No duration, or start - end / Xmin
  const { mainLabel, subLabel } = getTimeDurationDisplayLabels(time, duration);

  // inner corners (nearest other display) = 12, outer corners = 28
  const borderRadiusStyle = positionInRow === 'left'
    ? { borderTopLeftRadius: OUTER_RADIUS, borderBottomLeftRadius: OUTER_RADIUS, borderTopRightRadius: INNER_RADIUS, borderBottomRightRadius: INNER_RADIUS }
    : positionInRow === 'right'
      ? { borderTopLeftRadius: INNER_RADIUS, borderBottomLeftRadius: INNER_RADIUS, borderTopRightRadius: OUTER_RADIUS, borderBottomRightRadius: OUTER_RADIUS }
      : { borderRadius: OUTER_RADIUS };

  const content = (
    <>
      <ClockIcon size={ICON_SIZE} color={themeColors.text.primary()} isSolid />
      <View style={styles.textWrap}>
        <Text
          style={[getTextStyle('body-large'), { color: themeColors.text.primary(), fontWeight: '900' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {mainLabel}
        </Text>
        <Text
          style={[getTextStyle('body-medium'), styles.subLabel, { color: themeColors.text.tertiary(), fontWeight: '900' }]}
          numberOfLines={1}
        >
          {subLabel}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={themeColors.text.tertiary()} style={styles.chevron} />
    </>
  );

  const inner = (
    <View style={[styles.row, positionInRow != null && styles.rowStretch]}>
      {content}
    </View>
  );

  const wrapperStyle = [
    styles.wrapper,
    { backgroundColor, ...borderRadiusStyle },
    positionInRow != null && styles.wrapperStretch,
  ];

  if (onPress != null) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...wrapperStyle, { opacity: pressed ? 0.7 : 1 }]}
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={wrapperStyle}>{inner}</View>;
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  wrapperStretch: {
    flex: 1,
    minHeight: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
    paddingVertical: CONTENT_PADDING_VERTICAL,
  },
  rowStretch: {
    flex: 1,
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  // extra space between main and sub label
  subLabel: {
    marginTop: 6,
  },
  chevron: { marginLeft: 8 },
});

export default TimeDurationDisplay;
