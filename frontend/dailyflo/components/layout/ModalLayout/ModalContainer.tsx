/**
 * ModalContainer
 * 
 * A complete modal component that uses React Native's Modal component internally.
 * Provides the elevated surface that holds modal content with a header section and close button.
 * Integrates color palette and typography systems.
 * Supports both detail (pageSheet) and create (fullScreen) presentation styles.
 * Includes iOS-style slide up animation from bottom of screen.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export interface ModalContainerProps {
  children?: React.ReactNode;
  title?: string; // title text for the header
  onClose?: () => void; // callback when close button is pressed
  showCloseButton?: boolean; // whether to show the close button
  slideUp?: boolean; // whether to use slide up animation from bottom
  variant?: 'detail' | 'create'; // choose modal style; create is full-screen
  visible: boolean; // whether the modal is visible
  onRequestClose?: () => void; // callback for Android back button
  animationType?: 'slide' | 'fade' | 'none'; // animation type for modal
}

export function ModalContainer({ 
  children, 
  title = "Modal Title",
  onClose,
  showCloseButton = true,
  slideUp = true,
  variant = 'detail',
  visible,
  onRequestClose,
  animationType = 'slide',
}: ModalContainerProps) {
  // get theme-aware colors from color palette system
  const colors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // note: animation is now handled by React Native Modal component
  // no need for custom animation logic when using proper Modal component

  const isCreate = variant === 'create';

  // determine presentation style based on variant
  const presentationStyle = isCreate ? 'fullScreen' : 'pageSheet';

  // handle close functionality
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // handle request close (Android back button, etc.)
  const handleRequestClose = () => {
    if (onRequestClose) {
      onRequestClose();
    } else if (onClose) {
      onClose();
    }
  };

  // create dynamic styles using color palette and typography
  const styles = StyleSheet.create({
    container: {
      flex: 1, // take full height when used with React Native Modal
      width: '100%', // full width as requested
      borderBottomLeftRadius: isCreate ? 0 : (slideUp ? 0 : 16),
      borderBottomRightRadius: isCreate ? 0 : (slideUp ? 0 : 16),
      borderWidth: isCreate ? 0 : Platform.select({ 
        ios: StyleSheet.hairlineWidth, 
        android: StyleSheet.hairlineWidth, 
        default: 1 
      }),
      overflow: 'hidden',
      backgroundColor: isCreate ? colors.background.primary() : colors.background.elevated(),
      borderColor: isCreate ? 'transparent' : colors.border.primary(),
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      paddingBottom: 12, // slightly less bottom padding for visual balance
      paddingTop: isCreate ? insets.top : 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border.primary(),
      backgroundColor: isCreate ? colors.background.primary() : colors.background.elevated(),
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
    <Modal
      visible={visible}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={handleRequestClose}
    >
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
              onPress={handleClose}
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
    </Modal>
  );
}

export default ModalContainer;


