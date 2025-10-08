/**
 * ModalContainer
 * 
 * Flexible modal container that adapts to different presentation styles.
 * Supports fullScreen, pageSheet, and pageSheet with fixed height.
 * Used for task/list creation modals and detail views.
 * This is a presentational component - modal state management happens in parent.
 * 
 * Note: Headers are now managed by individual modals using the ModalHeader component.
 * This allows each modal to have custom header styling.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ViewStyle, TextStyle, DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type ModalPresentationStyle = 'fullScreen' | 'pageSheet' | 'pageSheetWithHeight';

export interface ModalContainerProps {
  children?: React.ReactNode;
  onClose?: () => void; // callback when close button is pressed (for fullScreen cancel button)
  showCancelButton?: boolean; // whether to show the cancel button (for fullScreen modals only)
  presentationStyle?: ModalPresentationStyle; // how the modal is presented
  height?: DimensionValue; // specific height for pageSheetWithHeight (e.g., 400 or '60%')
  noPadding?: boolean; // whether to remove content padding (for edge-to-edge content)
}

export function ModalContainer({ 
  children, 
  onClose,
  showCancelButton = true,
  presentationStyle = 'pageSheet',
  height,
  noPadding = false,
}: ModalContainerProps) {
  // get theme-aware colors from color palette system
  const colors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // determine styling based on presentation style
  const isFullScreen = presentationStyle === 'fullScreen';
  const isPageSheetWithHeight = presentationStyle === 'pageSheetWithHeight';

  // create dynamic styles using color palette and typography
  const containerStyle: ViewStyle = {
    flex: isPageSheetWithHeight ? 0 : 1,
    height: isPageSheetWithHeight ? height : undefined,
    width: '100%',
    borderWidth: isFullScreen ? 0 : Platform.select({ 
      ios: StyleSheet.hairlineWidth, 
      android: StyleSheet.hairlineWidth, 
      default: 1 
    }),
    overflow: 'hidden',
    backgroundColor: isFullScreen ? colors.background.primary() : colors.background.elevated(),
    borderColor: isFullScreen ? 'transparent' : colors.border.primary(),
  };

  // cancel button for fullScreen (positioned absolutely top-left)
  const cancelButtonStyle: ViewStyle = {
    position: 'absolute',
    top: insets.top + 8,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.interactive.tertiary(),
    zIndex: 1000,
  };
  
  const cancelTextStyle: TextStyle = {
    ...typography.getTextStyle('button-secondary'),
    color: colors.text.quaternary(),
  };
  
  const contentStyle: ViewStyle = {
    flex: 1,
    // apply padding unless noPadding prop is true or fullScreen style
    paddingHorizontal: noPadding || isFullScreen ? 0 : 16,
    paddingVertical: noPadding || isFullScreen ? 0 : 20,
  };

  return (
    <View style={containerStyle}>
      {/* fullScreen style: floating Cancel button at top-left */}
      {/* only shown for fullScreen modals when showCancelButton is true */}
      {isFullScreen && showCancelButton && onClose && (
        <TouchableOpacity
          style={cancelButtonStyle}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          accessibilityHint="Double tap to close this modal"
        >
          <Text style={cancelTextStyle}>Cancel</Text>
        </TouchableOpacity>
      )}
      
      {/* modal content */}
      {/* headers are now managed by individual modals using ModalHeader component */}
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}

export default ModalContainer;


