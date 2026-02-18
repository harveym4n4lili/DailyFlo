/**
 * DropdownList Component
 * 
 * A reusable dropdown list component that displays a list of custom menu items.
 * The menu appears as a modal overlay with a list of pressable items.
 * 
 * This component handles:
 * - Modal visibility management
 * - Menu item rendering with icons and labels
 * - Positioning based on anchor position
 * - Closing when user taps outside or presses back button
 * - Styling with theme colors and typography
 * 
 * Usage:
 * <DropdownList
 *   visible={isVisible}
 *   onClose={() => setIsVisible(false)}
 *   items={[
 *     {
 *       id: 'select-all',
 *       label: 'Select All',
 *       icon: 'checkmark-circle-outline',
 *       onPress: () => handleSelectAll(),
 *     },
 *     {
 *       id: 'delete',
 *       label: 'Delete',
 *       icon: 'trash-outline',
 *       onPress: () => handleDelete(),
 *       destructive: true,
 *     },
 *   ]}
 * />
 */

import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// import color palette system for consistent theming
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';

// import typography system for consistent text styling
import { useTypography } from '@/hooks/useTypography';

// import types for this component
import type { DropdownListProps, DropdownListItem, DropdownListAnchorPosition } from './DropdownList.types';

/**
 * DropdownList Component
 * 
 * Renders a modal dropdown list with custom items.
 * Each item can have a label, icon, and callback function.
 */
export default function DropdownList({
  visible,
  onClose,
  items,
  anchorPosition = 'top-right',
  topOffset = 0,
  rightOffset = 20,
  leftOffset = 20,
}: DropdownListProps) {
  // get theme-aware colors from the color palette system
  // themeColors: provides background, text, and border colors that adapt to light/dark theme
  // semanticColors: provides semantic colors like error (red) for destructive actions
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();

  // get typography system for consistent text styling
  // typography: provides predefined text styles (body-large, heading-1, etc.) with satoshi font
  const typography = useTypography();

  // get safe area insets for proper positioning on devices with notches
  // insets: provides top, bottom, left, right padding values for safe areas
  const insets = useSafeAreaInsets();

  // create dynamic styles using theme colors, typography, and insets
  // styles are recreated when theme or insets change to ensure proper theming
  const styles = createStyles(themeColors, semanticColors, typography, insets);

  // calculate overlay style based on anchor position
  // this determines where the menu appears on the screen
  const getOverlayStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      justifyContent: 'flex-start',
      paddingTop: topOffset + insets.top,
    };

    // position menu based on anchor position
    // top-right: align to right side (default for ellipse buttons)
    if (anchorPosition === 'top-right') {
      return {
        ...baseStyle,
        alignItems: 'flex-end',
        paddingRight: rightOffset,
      };
    }
    
    // top-left: align to left side
    if (anchorPosition === 'top-left') {
      return {
        ...baseStyle,
        alignItems: 'flex-start',
        paddingLeft: leftOffset,
      };
    }
    
    // bottom-right: align to right side at bottom
    if (anchorPosition === 'bottom-right') {
      return {
        ...baseStyle,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingBottom: insets.bottom,
        paddingRight: rightOffset,
      };
    }
    
    // bottom-left: align to left side at bottom
    if (anchorPosition === 'bottom-left') {
      return {
        ...baseStyle,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        paddingBottom: insets.bottom,
        paddingLeft: leftOffset,
      };
    }

    // default to top-right if invalid position
    return {
      ...baseStyle,
      alignItems: 'flex-end',
      paddingRight: rightOffset,
    };
  };

  // handle menu item press
  // calls the item's onPress callback and closes the menu
  const handleItemPress = (item: DropdownListItem) => {
    if (item.disabled) {
      // don't do anything if item is disabled
      return;
    }
    
    // call the item's onPress callback to handle the action
    item.onPress();
    
    // close the menu after item is pressed
    onClose();
  };

  // render individual menu item
  // each item is a pressable row with label and optional icon
  const renderMenuItem = (item: DropdownListItem) => {
    // determine text color based on item state
    // destructive items use error color (red), disabled items use tertiary color (gray)
    // normal items use primary text color
    let textColor = themeColors.text.primary();
    if (item.destructive) {
      textColor = semanticColors.error();
    } else if (item.disabled) {
      textColor = themeColors.text.tertiary();
    }

    // determine icon color (same logic as text color)
    const iconColor = textColor;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
        disabled={item.disabled}
      >
        {/* optional icon on the left side - use custom iconComponent or Ionicons */}
        {(item.iconComponent || item.icon) && (
          <View style={styles.menuItemIcon}>
            {item.iconComponent ? item.iconComponent(iconColor) : (
              <Ionicons
                name={item.icon as any}
                size={20}
                color={iconColor}
              />
            )}
          </View>
        )}
        {/* menu item label text */}
        <Text style={[styles.menuItemText, { color: textColor }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* overlay that covers the entire screen */}
      {/* tapping outside the menu closes it */}
      <TouchableOpacity
        style={getOverlayStyle()}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* dropdown list container with rounded corners */}
        <View style={styles.listContainer}>
          {items.map(renderMenuItem)}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * Create dynamic styles using theme colors, typography, and safe area insets
 * 
 * This function generates styles that adapt to the current theme (light/dark)
 * and uses the typography system for consistent text styling.
 */
const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
  insets: { top: number; bottom: number; left: number; right: number }
) =>
  StyleSheet.create({
    // dropdown list container styling
    // this is the rounded box that contains all menu items
    listContainer: {
      backgroundColor: themeColors.background.tertiary(), // use tertiary background for elevated appearance
      borderRadius: 12, // rounded corners for modern look
      minWidth: 150, // minimum width to ensure menu isn't too narrow
      // add shadow for depth (iOS shadow properties)
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      // android shadow
      elevation: 5,
    },

    // individual menu item styling
    // each item is a horizontal row with optional icon and label
    menuItem: {
      flexDirection: 'row', // horizontal layout for icon and label
      alignItems: 'center', // center align vertically
      paddingHorizontal: 16, // horizontal padding inside each item
      paddingVertical: 12, // vertical padding inside each item
    },

    // menu item text styling - body-large (16px, regular, satoshi)
    menuItemText: {
      ...typography.getTextStyle('body-large'),
    },

    // menu item icon styling
    // icon appears on the left side of each menu item
    menuItemIcon: {
      marginRight: 8, // space between icon and label
    },
  });

