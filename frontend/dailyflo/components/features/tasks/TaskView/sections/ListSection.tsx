/**
 * ListSection Component
 * 
 * Displays the task's associated list with name and icon.
 * Shows "Inbox" and inbox icon by default when no list is associated.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export interface ListSectionProps {
  /** List ID (null or undefined means inbox) */
  listId?: string | null;
  /** List name (optional, will show "Inbox" if not provided and listId is null) */
  listName?: string;
  /** List icon (optional, will show inbox icon if not provided and listId is null) */
  listIcon?: string;
}

/**
 * ListSection Component
 * 
 * Displays the task's associated list name and icon.
 * Defaults to "Inbox" with inbox icon when no list is associated.
 */
export const ListSection: React.FC<ListSectionProps> = ({ 
  listId, 
  listName, 
  listIcon 
}) => {
  // HOOKS
  // get theme-aware colors for styling
  const themeColors = useThemeColors();
  // get typography system for text styling
  const typography = useTypography();

  // determine if task is in inbox (no listId or listId is null)
  // inbox is the default location for tasks without a specific list
  const isInbox = !listId;

  // determine the icon to display
  // use list icon if provided, otherwise use mail icon for inbox tasks
  const displayIcon = isInbox ? 'mail-outline' : (listIcon || 'folder-outline');

  // determine the text to display
  // use list name if provided, otherwise show "Inbox" for inbox tasks
  const displayText = isInbox ? 'Inbox' : (listName || 'List');

  return (
    <View style={styles.container}>
      {/* list icon - displayed on the left */}
      <Ionicons
        name={displayIcon as any}
        size={16}
        color={themeColors.text.secondary()}
        style={styles.icon}
      />
      
      {/* list name text - displays list name or "Inbox" */}
      <Text 
        style={[
          styles.listText,
          { color: themeColors.text.secondary() },
          typography.getTextStyle('body-large')
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
};

// STYLES
// stylesheet for component styling
const styles = StyleSheet.create({
  // container - horizontal layout for icon and text
  container: {
    flexDirection: 'row', // horizontal layout for icon and text
    alignItems: 'center', // vertically center icon and text
  },
  
  // icon style - spacing for list icon
  icon: {
    marginRight: 8, // space between icon and text
  },
  
  // list text style
  listText: {
    // typography is applied inline via getTextStyle
  },
});

export default ListSection;

