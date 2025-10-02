/**
 * ModalContainer
 * 
 * Provides the elevated surface that holds modal content.
 * includes a header section with close button and integrates color palette and typography systems.
 * supports iOS-style slide up animation from bottom of screen.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export interface ModalContainerProps {
  children?: React.ReactNode;
  title?: string; // title text for the header
  onClose?: () => void; // callback when close button is pressed
  showCloseButton?: boolean; // whether to show the close button
  slideUp?: boolean; // whether to use slide up animation from bottom
}

export function ModalContainer({ 
  children, 
  title = "Modal Title",
  onClose,
  showCloseButton = true,
  slideUp = true 
}: ModalContainerProps) {
  // get theme-aware colors from color palette system
  const colors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();
  
  // note: animation is now handled by React Native Modal component
  // no need for custom animation logic when using proper Modal component

  // create dynamic styles using color palette and typography
  const styles = StyleSheet.create({
    container: {
      flex: 1, // take full height when used with React Native Modal
      width: '100%', // full width as requested
      borderBottomLeftRadius: slideUp ? 0 : 16, // no bottom radius for slide up (touches bottom)
      borderBottomRightRadius: slideUp ? 0 : 16, // no bottom radius for slide up (touches bottom)
      borderWidth: Platform.select({ 
        ios: StyleSheet.hairlineWidth, 
        android: StyleSheet.hairlineWidth, 
        default: 1 
      }),
      overflow: 'hidden',
      backgroundColor: colors.background.elevated(),
      borderColor: colors.border.primary(),
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 12, // slightly less bottom padding for visual balance
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.primary(),
      backgroundColor: colors.background.elevated(),
    },
    
    titleContainer: {
      flex: 1,
      marginRight: 16, // space for close button
    },
    
    title: {
      // use heading-3 text style from typography system (18px, bold, satoshi font)
      ...typography.getTextStyle('heading-3'),
      color: colors.text.primary(),
      textAlign: 'left',
    },
    
    closeButton: {
      width: 44, // minimum touch target size for accessibility
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    
    closeIcon: {
      // icon styling handled by Ionicons component props
    },
    
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
  });

  return (
    <View style={styles.container}>
      {/* header section with title and close button */}
      <View style={styles.header}>
        {/* title section */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
        </View>
        
        {/* close button section */}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close modal"
            accessibilityHint="Double tap to close this modal"
          >
            <Ionicons
              name="close"
              size={24}
              color={colors.text.secondary()}
              style={styles.closeIcon}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* modal content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

export default ModalContainer;


