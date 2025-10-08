/**
 * ModalHeader Component
 * 
 * Reusable header component for modals.
 * Each modal can customize its own header styling while maintaining consistency.
 * 
 * Features:
 * - Customizable title text and styling
 * - Optional close button
 * - Optional border bottom
 * - Theme-aware colors
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

/**
 * Props for ModalHeader component
 */
export interface ModalHeaderProps {
  /**
   * Title text to display in the header
   */
  title?: string;
  
  /**
   * Callback when close button is pressed
   */
  onClose?: () => void;
  
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Whether to show border at bottom of header
   * @default true
   */
  showBorder?: boolean;
  
  /**
   * Custom title text style override
   */
  titleStyle?: TextStyle;
  
  /**
   * Custom container style override
   */
  containerStyle?: ViewStyle;
  
  /**
   * Custom background color
   */
  backgroundColor?: string;
  
  /**
   * Horizontal padding
   * @default 16
   */
  paddingHorizontal?: number;
  
  /**
   * Vertical padding
   * @default 8
   */
  paddingVertical?: number;
}

/**
 * ModalHeader Component
 * 
 * Displays a header with title and optional close button.
 * Provides consistent styling across modals while allowing customization.
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
  showBorder = true,
  titleStyle: customTitleStyle,
  containerStyle: customContainerStyle,
  backgroundColor,
  paddingHorizontal = 16,
  paddingVertical = 8,
}) => {
  // get theme-aware colors
  const colors = useThemeColors();
  
  // get typography system
  const typography = useTypography();
  
  // header container style
  const headerStyle: ViewStyle = {
    minHeight: 60,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal,
    // remove vertical padding so the title is mathematically centered in the 60px header
    paddingVertical: 0,
    paddingBottom: 0,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary(),
    backgroundColor: backgroundColor || colors.background.elevated(),
    ...customContainerStyle,
  };
  
  // title container style
  const titleContainerStyle: ViewStyle = {
    flex: 1,
    // occupy full height to center perfectly
    height: '100%',
    // center title both vertically and horizontally; close button is absolute
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  // title text style
  const titleStyle: TextStyle = {
    ...typography.getTextStyle('heading-2'),
    color: colors.text.primary(),
    textAlign: 'center',
    ...customTitleStyle,
  };
  
  // close button style
  const closeButtonStyle: ViewStyle = {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.tertiary(),
  };

  return (
    <View style={headerStyle}>
      {/* title section */}
      <View style={titleContainerStyle}>
        {title && <Text style={titleStyle}>{title}</Text>}
      </View>
      
      {/* close button section */}
      {showCloseButton && onClose && (
        <TouchableOpacity
          style={closeButtonStyle}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
          accessibilityHint="Double tap to close this modal"
        >
          <Ionicons
            name="close"
            size={16}
            color={colors.text.primary()}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ModalHeader;

