/**
 * TaskIndicators Component
 * 
 * Displays bottom-right indicators for a task card, including routine type
 * (Daily/Weekly/Monthly) and list/inbox status. These indicators have
 * transparent backgrounds and use tertiary text color.
 * 
 * This component is used by TaskCard to display task metadata indicators.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

interface TaskIndicatorsProps {
  // routine type - determines if repeating indicator is shown
  routineType: 'once' | 'daily' | 'weekly' | 'monthly';
  // optional list ID - determines if "List" or "Inbox" is shown
  listId?: string | null;
}

/**
 * TaskIndicators Component
 * 
 * Renders bottom-right indicators showing routine type and list/inbox status.
 * Icons and text use tertiary color with transparent backgrounds.
 */
export default function TaskIndicators({
  routineType,
  listId,
}: TaskIndicatorsProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  // create dynamic styles using theme colors and typography
  const styles = createStyles(themeColors, typography);

  // get routine type text based on routineType
  const getRoutineText = () => {
    switch (routineType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      {/* repeating indicator - conditionally rendered only when routine type is not 'once' */}
      {routineType !== 'once' && (
        <View style={styles.indicator}>
          {/* refresh icon for repeating tasks */}
          <Ionicons
            name="refresh"
            size={12}
            color={themeColors.text.tertiary()}
            style={styles.indicatorIcon}
          />
          {/* repeating frequency text */}
          <Text style={styles.indicatorText}>{getRoutineText()}</Text>
        </View>
      )}

      {/* list indicator - always rendered */}
      <View style={styles.indicator}>
        {/* folder icon for list/inbox indication */}
        <Ionicons
          name="folder-outline"
          size={12}
          color={themeColors.text.tertiary()}
          style={styles.indicatorIcon}
        />
        {/* list/inbox text - conditionally shows 'List' or 'Inbox' based on listId */}
        <Text style={styles.indicatorText}>
          {listId ? 'List' : 'Inbox'}
        </Text>
      </View>
    </View>
  );
}

// create dynamic styles using theme colors and typography
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) => StyleSheet.create({
  // bottom indicators container - positioned absolutely at bottom right
  container: {
    position: 'absolute',
    bottom: 14, // same padding as card
    right: 16, // same padding as card
    flexDirection: 'row', // horizontal layout for multiple indicators
    alignItems: 'center',
    gap: 8, // spacing between indicators
  },

  // individual indicator styling
  indicator: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center',
    backgroundColor: 'transparent', // transparent background for all indicators
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // indicator icon styling
  indicatorIcon: {
    marginRight: 4,
  },

  // indicator text styling
  indicatorText: {
    // use the body-medium text style from typography system (12px, regular, satoshi font)
    // match metadataValue styling exactly: same typography, font weight, and size
    ...typography.getTextStyle('body-medium'),
    // use tertiary text color for bottom right tags (Inbox, Weekly, etc.) - matches icon color
    color: themeColors.text.tertiary(),
    fontWeight: '900', // match metadataValue font weight
  },
});

