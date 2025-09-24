import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function TodayLayout() {
  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();
  
  // create dynamic styles using the color palette system and typography system
  const styles = StyleSheet.create({
    // fixed top section with ellipse button - stays at top of screen
    fixedTopSection: {
      position: 'absolute',
      top: insets.top, // respect safe area top inset (status bar)
      left: 0,
      right: 0,
      zIndex: 1000, // ensure it stays above other content
      paddingHorizontal: 20,
      paddingBottom: 10,
      justifyContent: 'center',
      alignItems: 'flex-end', // align ellipse button to the right
      backgroundColor: themeColors.background.primary(), // match background color
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.primary(),
    },

    // ellipse button styling
    ellipseButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // dropdown overlay for modal background
    dropdownOverlay: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: insets.top + 60, // position below the ellipse button (safe area + button height)
      paddingRight: 20,
    },

    // dropdown menu container
    dropdownMenu: {
      backgroundColor: themeColors.background.tertiary(),
      borderRadius: 12,
      minWidth: 150,
    },

    // dropdown menu item
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    // dropdown icon styling
    dropdownIcon: {
      // no margin needed - justifyContent: 'space-between' handles spacing
    },

    // dropdown text styling
    dropdownText: {
      // use the body-large text style from typography system (14px, regular, satoshi font)
      ...typography.getTextStyle('body-large'),
      color: themeColors.text.primary(),
      fontWeight: '500',
    },
  });

  // DROPDOWN HANDLERS - Functions that handle dropdown menu interactions
  
  // handle ellipse button press - toggles dropdown visibility
  const handleEllipsePress = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // handle select all option - selects all tasks for today
  const handleSelectAll = () => {
    console.log('📋 Select all tasks requested');
    // TODO: Implement select all functionality
    setIsDropdownVisible(false); // close dropdown after action
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Fixed top section with ellipse button - stays at top */}
      <View style={styles.fixedTopSection}>
        <TouchableOpacity
          style={styles.ellipseButton}
          onPress={handleEllipsePress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={32} 
            color={themeColors.text.primary()} 
          />
        </TouchableOpacity>
      </View>

      {/* dropdown menu modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownVisible(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleSelectAll}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownText}>Select All</Text>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={20} 
                color={themeColors.text.primary()} 
                style={styles.dropdownIcon}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Today',
            headerShown: false 
          }} 
        />
      </Stack>
    </View>
  );
}
