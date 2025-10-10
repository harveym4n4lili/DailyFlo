import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export default function TodayLayout() {
  // DROPDOWN STATE - Controls the visibility of the dropdown menu
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  
  // TITLE STATE - Controls the visibility of the title header
  // Set to true to show the title, false to hide it
  const [showTitle, setShowTitle] = useState(false);
  
  // Animated value for title fade effect
  const titleOpacity = useRef(new Animated.Value(0)).current;
  
  // Ref to track if animation is currently running
  const isAnimatingRef = useRef(false);
  
  // Ref to track scroll position
  const scrollRef = useRef<any>(null);
  
  // SAFE AREA INSETS - Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // COLOR PALETTE USAGE - Getting theme-aware colors
  const themeColors = useThemeColors();
  
  // TYPOGRAPHY USAGE - Getting typography system for consistent text styling
  const typography = useTypography();

  // SCROLL DETECTION EFFECT
  // Monitor scroll position and show title when screen title is covered
  useEffect(() => {
    const handleScrollChange = (scrollY: number) => {
      // Calculate if the header title from the index screen is covered by the top section
      // We want to show title when scroll position reaches where the screen title would be covered
      // Threshold is set to capture when the index screen "Today" title gets covered
      const titleThreshold = insets.top - 30; // Scroll position where "Today" title in index screen becomes covered
      
      // Show layout title with fade animation if scroll position covers the screen title
      if (scrollY >= titleThreshold && !showTitle && !isAnimatingRef.current) {
        setShowTitle(true);
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          isAnimatingRef.current = false;
        });
      } else if (scrollY < titleThreshold && showTitle && !isAnimatingRef.current) {
        // Fade out and then hide
        isAnimatingRef.current = true;
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowTitle(false);
          isAnimatingRef.current = false;
        });
      }
    };

    // Function to pass scroll changes from child screens
    // This will be called from the index screen when scrolling
    (global as any).trackScrollToTodayLayout = handleScrollChange;

    // Cleanup: Remove the global handler when component unmounts
    return () => {
      delete (global as any).trackScrollToTodayLayout;
    };
  }, [insets.top, showTitle, titleOpacity]);
  
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
      height: insets.top + 10, // fixed height to maintain consistent top section height
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.background.primary(), // match background color
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.primary(),
    },

    // title container - ensures consistent layout structure
    titleContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // title header styling
    titleHeader: {
      ...typography.getTextStyle('heading-2'),
      color: themeColors.text.primary(),
      fontWeight: '600',
    },

    // ellipse button styling
    ellipseButton: {
      position: 'absolute',
      right: 20,
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
      paddingTop: insets.top + 72, // position below the ellipse button (safe area + header height)
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

  // TITLE CONTROL FUNCTIONS - Functions that control title visibility
  
  // toggle title visibility - allows programmatic control of title display
  const toggleTitleVisibility = () => {
    setShowTitle(!showTitle);
  };
  
  // show title - sets title visibility to true
  const showTitleHeader = () => {
    setShowTitle(true);
  };
  
  // hide title - sets title visibility to false
  const hideTitleHeader = () => {
    setShowTitle(false);
  };
  
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
      {/* Fixed top section with title and ellipse button - stays at top */}
      <View style={styles.fixedTopSection}>
        <View style={styles.titleContainer}>
          {showTitle && (
            <Animated.View style={{ opacity: titleOpacity }}>
              <Text style={styles.titleHeader}>Today</Text>
            </Animated.View>
          )}
        </View>
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
