/**
 * ModalContainer
 * 
 * Flexible modal container that adapts to different presentation styles.
 * Supports fullScreen, pageSheet, and pageSheet with fixed height.
 * Used for task/list creation modals and detail views.
 * This is a presentational component - modal state management happens in parent.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ViewStyle, TextStyle, DimensionValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

export type ModalPresentationStyle = 'fullScreen' | 'pageSheet' | 'pageSheetWithHeight';

export interface ModalContainerProps {
  children?: React.ReactNode;
  title?: string; // title text for the header
  onClose?: () => void; // callback when close button is pressed
  showCloseButton?: boolean; // whether to show the close button (X icon for pageSheet, Cancel text for fullScreen)
  presentationStyle?: ModalPresentationStyle; // how the modal is presented
  height?: DimensionValue; // specific height for pageSheetWithHeight (e.g., 400 or '60%')
  showHeader?: boolean; // whether to show the header section (title + close button)
}

export function ModalContainer({ 
  children, 
  title = "Modal Title",
  onClose,
  showCloseButton = true,
  presentationStyle = 'pageSheet',
  height,
  showHeader = true,
}: ModalContainerProps) {
  // get theme-aware colors from color palette system
  const colors = useThemeColors();
  
  // get typography system for consistent text styling
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  
  // determine styling based on presentation style
  const isFullScreen = presentationStyle === 'fullScreen';
  const isPageSheet = presentationStyle === 'pageSheet';
  const isPageSheetWithHeight = presentationStyle === 'pageSheetWithHeight';

  // create dynamic styles using color palette and typography
  const containerStyle: ViewStyle = {
    flex: isPageSheetWithHeight ? 0 : 1,
    height: isPageSheetWithHeight ? height : undefined,
    width: '100%',
    borderTopLeftRadius: isFullScreen ? 0 : 16,
    borderTopRightRadius: isFullScreen ? 0 : 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: isFullScreen ? 0 : Platform.select({ 
      ios: StyleSheet.hairlineWidth, 
      android: StyleSheet.hairlineWidth, 
      default: 1 
    }),
    overflow: 'hidden',
    backgroundColor: isFullScreen ? colors.background.primary() : colors.background.elevated(),
    borderColor: isFullScreen ? 'transparent' : colors.border.primary(),
  };
  
  // header for pageSheet styles (title + X button)
  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.primary(),
    backgroundColor: isFullScreen ? colors.background.primary() : colors.background.elevated(),
  };
  
  const titleContainerStyle: ViewStyle = {
    flex: 1,
    marginRight: 16, // space for close button
  };
  
  const titleStyle: TextStyle = {
    // use heading-3 text style from typography system (18px, bold, satoshi font)
    ...typography.getTextStyle('heading-3'),
    color: colors.text.primary(),
    textAlign: 'left',
  };
  
  const closeButtonStyle: ViewStyle = {
    width: 44, // minimum touch target size for accessibility
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    paddingHorizontal: isFullScreen ? 0 : 16,
    paddingVertical: isFullScreen ? 0 : 20,
  };

  return (
    <View style={containerStyle}>
      {/* fullScreen style: floating Cancel button at top-left */}
      {isFullScreen && showCloseButton && onClose && (
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

      {/* pageSheet styles: header section with title and close button */}
      {!isFullScreen && showHeader && (
        <View style={headerStyle}>
          {/* title section */}
          <View style={titleContainerStyle}>
            <Text style={titleStyle}>{title}</Text>
          </View>
          
          {/* close button section */}
          {showCloseButton && (
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
                size={24}
                color={colors.text.secondary()}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* modal content */}
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}

export default ModalContainer;


