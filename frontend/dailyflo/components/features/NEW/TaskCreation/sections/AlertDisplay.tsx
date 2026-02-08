/**
 * AlertDisplay Section
 *
 * Dynamic messaging: no alerts → main "No Alerts"; 1+ → main "X Alerts". Sub label "Nudge" for now.
 * Same elevated style as TimeDurationDisplay. Tappable to open alerts picker.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { BellIcon } from '@/components/ui/Icon';

const ICON_SIZE = 18;
const INNER_RADIUS = 8; // corners nearest the other display when side by side
const OUTER_RADIUS = 28; // outer corners when side by side
const CONTENT_PADDING_HORIZONTAL = 16;
const CONTENT_PADDING_VERTICAL = 14;

export interface AlertDisplayProps {
  /** Number of alerts selected (0 = "No Alerts", 1 = "1 Alert", etc.) */
  alertsCount?: number;
  /** When provided, the row is pressable and opens the alerts picker */
  onPress?: () => void;
  /** When "right", use 12 on left (inner) corners and 28 on right corners for side-by-side layout */
  positionInRow?: 'left' | 'right';
}

/**
 * Renders a single row with elevated background showing alerts summary.
 * Main label from alertsCount; sub label "Nudge" for now.
 */
export const AlertDisplay: React.FC<AlertDisplayProps> = ({
  alertsCount = 0,
  onPress,
  positionInRow,
}) => {
  const themeColors = useThemeColors();
  const backgroundColor = themeColors.background.elevated();

  // main: no alerts → "No Alerts"; 1 → "1 Alert"; n → "n Alerts". sub: "Nudge" for now
  const mainLabel = alertsCount === 0 ? 'No Alerts' : `${alertsCount} Alert${alertsCount === 1 ? '' : 's'}`;
  const subLabel = 'Nudge';

  // inner corners (nearest other display) = 12, outer corners = 28
  const borderRadiusStyle = positionInRow === 'left'
    ? { borderTopLeftRadius: OUTER_RADIUS, borderBottomLeftRadius: OUTER_RADIUS, borderTopRightRadius: INNER_RADIUS, borderBottomRightRadius: INNER_RADIUS }
    : positionInRow === 'right'
      ? { borderTopLeftRadius: INNER_RADIUS, borderBottomLeftRadius: INNER_RADIUS, borderTopRightRadius: OUTER_RADIUS, borderBottomRightRadius: OUTER_RADIUS }
      : { borderRadius: OUTER_RADIUS };

  const content = (
    <>
      <BellIcon size={ICON_SIZE} color={themeColors.text.primary()} isSolid />
      <View style={styles.textWrap}>
        <Text
          style={[getTextStyle('body-large'), { color: themeColors.text.primary() }]}
          numberOfLines={1}
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

export default AlertDisplay;
