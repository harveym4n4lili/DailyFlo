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
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
// import directly from CloseButton to avoid require cycle with Button barrel
import { MainCloseButton } from '@/components/ui/button/CloseButton';

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
   * Position of the close button
   * @default "right"
   */
  closeButtonPosition?: 'left' | 'right';
  
  /**
   * Whether to show border at bottom of header
   * @default true
   */
  showBorder?: boolean;
  
  /**
   * Whether to show the draggable indicator (small rounded bar at top)
   * useful for bottom sheet style modals that can be dragged
   * @default false
   */
  showDragIndicator?: boolean;
  
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
  
  /**
   * Whether to show iOS-style text buttons (Cancel/Done)
   * When true, shows Cancel on left and Done on right (if hasChanges is true)
   * @default false
   */
  showActionButtons?: boolean;
  
  /**
   * Whether there are changes that need to be saved
   * Controls visibility of the Done button
   * @default false
   */
  hasChanges?: boolean;
  
  /**
   * Callback when cancel button is pressed
   * Shows confirmation if hasChanges is true
   */
  onCancel?: () => void;
  
  /**
   * Callback when done button is pressed
   */
  onDone?: () => void;
  
  /**
   * Custom text for cancel button
   * @default "Cancel"
   */
  cancelText?: string;
  
  /**
   * Custom text for done button
   * @default "Done"
   */
  doneText?: string;
  
  /**
   * Task category color for button styling
   * When provided, Cancel/Done buttons use this color
   * When task color is white, button text uses FAB icon color for contrast
   */
  taskCategoryColor?: TaskColor;
  
  /**
   * Whether to use MainCloseButton instead of default close button
   * When true, uses the MainCloseButton component with task category color styling
   * @default false
   */
  useMainCloseButton?: boolean;
}

/**
 * ModalHeader Component
 * 
 * Displays a header with title and optional close button or action buttons.
 * Provides consistent styling across modals while allowing customization.
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  onClose,
  showCloseButton = true,
  closeButtonPosition = 'right',
  showBorder = true,
  showDragIndicator = false,
  titleStyle: customTitleStyle,
  containerStyle: customContainerStyle,
  backgroundColor,
  paddingHorizontal = Paddings.card,
  paddingVertical = Paddings.contextMenuVertical,
  showActionButtons = false,
  hasChanges = false,
  onCancel,
  onDone,
  cancelText = 'Cancel',
  doneText = 'Done',
  taskCategoryColor,
  useMainCloseButton = false,
}) => {
  // get theme-aware colors
  const colors = useThemeColors();
  
  // get typography system
  const typography = useTypography();
  
  /**
   * Get iOS version number for conditional styling
   * iOS 15+ introduced the glass UI design with updated header styling
   * Returns the major version number (e.g., 14, 15, 16, 17)
   */
  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    // Platform.Version can be a string like "15.0" or number like 15
    // parse it to get the major version number
    const majorVersion = typeof version === 'string' 
      ? parseInt(version.split('.')[0], 10) 
      : Math.floor(version as number);
    return majorVersion;
  };
  
  // check if running on iOS 15+ (newer glass UI design)
  const isNewerIOS = getIOSVersion() >= 15;
  
  // determine button text color based on task category color
  // always use task category color, including white case
  const getButtonTextColor = () => {
    if (taskCategoryColor) {
      // use task category color directly - white case uses white color
      return TaskCategoryColors[taskCategoryColor][500]; // task category color
    }
    return '#007AFF'; // default iOS blue if no task color provided
  };
  
  // handle cancel button press without confirmation
  const handleCancelPress = () => {
    if (onCancel) {
      // call cancel directly without confirmation alert
      onCancel();
    }
  };
  
  // header container style
  // iOS 15+ (newer): slightly bigger height for glass UI design with equal spacing
  // iOS < 15 (older): current height stays the same
  // For iOS 15+: buttons are 16px from top, 38px tall, need 16px from bottom = 70px total height
  const headerStyle: ViewStyle = {
    minHeight: isNewerIOS ? 52 : 48, // iOS 15+: 52px, iOS < 15: 48px
    height: isNewerIOS ? 70 : 56, // iOS 15+: 70px (16px top + 38px button + 16px bottom), iOS < 15: 56px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal,
    // iOS 15+ (newer): add bottom padding to match top spacing (16px from top = 16px from bottom)
    // iOS < 15 (older): no vertical padding (title is mathematically centered)
    paddingVertical: Paddings.none,
    paddingBottom: isNewerIOS ? paddingHorizontal : Paddings.none,
    paddingTop: Paddings.none,
    // conditionally show bottom border based on showBorder prop
    ...(showBorder && {
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary(),
    }),
    // use provided backgroundColor or transparent to show modal background
    backgroundColor: backgroundColor || 'transparent',
    ...customContainerStyle,
  };
  
  // title container style
  // iOS 15+ (newer): remove top padding to properly center title vertically
  // iOS < 15 (older): keep top padding to maintain current appearance
  const titleContainerStyle: ViewStyle = {
    flex: 1,
    // occupy full height to center perfectly
    height: '100%',
    // center title both vertically and horizontally; close button is absolute
    alignItems: 'center',
    justifyContent: 'center',
    // iOS 15+: no top padding for proper vertical centering
    // iOS < 15: add top padding to lower the text slightly (current style)
    paddingTop: isNewerIOS ? Paddings.card : Paddings.touchTargetSmall,
  };
  
  // title text style
  const titleStyle: TextStyle = {
    ...typography.getTextStyle('heading-3'),
    color: colors.text.primary(),
    textAlign: 'center',
    ...customTitleStyle,
  };
  
  // close button style
  // iOS 15+ (newer): equal spacing from top and edges (left or right)
  // iOS < 15 (older): current positioning stays
  // no background circle - just the X icon
  const closeButtonSpacing = isNewerIOS ? 16 : 15; // iOS 15+: 16px (equal spacing), iOS < 15: 15px (current)
  const closeButtonStyle: ViewStyle = {
    position: 'absolute',
    // iOS 15+: equal spacing (16px from top and edge) ensures proper visual spacing
    // iOS < 15: current spacing (15px from top and edge) - maintains current appearance
    top: closeButtonSpacing, // equal spacing from top edge
    // position on left or right based on closeButtonPosition prop
    ...(closeButtonPosition === 'left' 
      ? { left: closeButtonSpacing } 
      : { right: closeButtonSpacing }
    ),
    // no width/height constraints - icon determines size
    alignItems: 'center',
    justifyContent: 'center',
    // no background color - transparent
    padding: Paddings.touchTargetSmall,
  };

  return (
    <View>
      {/* header section with title and optional close button */}
      <View style={headerStyle}>
        {/* drag indicator - positioned absolutely at the top, doesn't affect spacing */}
        {/* small rounded bar that visually indicates the modal can be dragged */}
        {showDragIndicator && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <View
              style={{
                // iOS 15+ (newer): reduced width for draggable indicator
                // iOS < 15 (older): current width stays
                width: isNewerIOS ? 36 : 42, // iOS 15+: 36px (reduced from 42px), iOS < 15: 42px
                // iOS 15+ (newer): thinner draggable indicator line
                // iOS < 15 (older): current thickness stays
                height: isNewerIOS ? 5 : 6, // iOS 15+: 4px, iOS < 15: 6px
                borderRadius: isNewerIOS ? 2 : 3, // iOS 15+: 2px, iOS < 15: 3px
                backgroundColor: colors.interactive.tertiary(),

              }}
            />
          </View>
        )}
        
        {/* title section */}
        <View style={titleContainerStyle}>
          {title && <Text style={titleStyle}>{title}</Text>}
        </View>
        
        {/* ios-style action buttons (cancel/done) */}
        {showActionButtons ? (
          <>
            {/* cancel button on the left */}
            {onCancel && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  // iOS 15+ (newer): equal spacing from top and left edges (16px each)
                  // iOS < 15 (older): current positioning (centered vertically, 16px from left)
                  left: paddingHorizontal, // 16px from left edge
                  ...(isNewerIOS ? {
                    // iOS 15+: equal spacing from top and left (16px each)
                    top: paddingHorizontal, // 16px from top edge to match left spacing
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background.tertiary(),

                  } : {
                    // iOS < 15: current style (centered vertically)
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    paddingVertical: Paddings.contextMenuVertical,
                  }),
                }}
                onPress={handleCancelPress}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                {isNewerIOS ? (
                  // iOS 15+ (newer): X close icon button
                  <Ionicons
                    name="close"
                    size={32}
                    color={getButtonTextColor()}
                  />
                ) : (
                  // iOS < 15 (older): text button (current style)
                  <Text
                    style={{
                      ...typography.getTextStyle('body-large'),
                      color: getButtonTextColor(), // task category color, or FAB icon color when white
                      fontSize: 17,
                    }}
                  >
                    {cancelText}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            
            {/* done button on the right - only show if there are changes */}
            {hasChanges && onDone && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  // iOS 15+ (newer): equal spacing from top and right edges (16px each)
                  // iOS < 15 (older): current positioning (centered vertically, 16px from right)
                  right: paddingHorizontal, // 16px from right edge
                  ...(isNewerIOS ? {
                    // iOS 15+: equal spacing from top and right (16px each)
                    top: paddingHorizontal, // 16px from top edge to match right spacing
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background.tertiary(),

                  } : {
                    // iOS < 15: current style (centered vertically)
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    paddingVertical: Paddings.contextMenuVertical,
                  }),
                }}
                onPress={onDone}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                {isNewerIOS ? (
                  // iOS 15+ (newer): tick/checkmark icon button
                  <Ionicons
                    name="checkmark"
                    size={28}
                    color={getButtonTextColor()}
                  />
                ) : (
                  // iOS < 15 (older): text button (current style)
                  <Text
                    style={{
                      ...typography.getTextStyle('body-large'),
                      color: getButtonTextColor(), // task category color, or FAB icon color when white
                      fontSize: 17,
                    }}
                  >
                    {doneText}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* close button section - only show if not using action buttons */
          showCloseButton && onClose && (
            useMainCloseButton ? (
              /* use MainCloseButton component when useMainCloseButton is true */
              <MainCloseButton
                onPress={onClose}
                color={taskCategoryColor || 'blue'}
                {...(closeButtonPosition === 'left' 
                  ? { left: closeButtonSpacing }
                  : { right: closeButtonSpacing }
                )}
                top={closeButtonSpacing}
              />
            ) : (
              /* default close button - simple X icon */
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
                  size={30}
                  color={colors.text.secondary()}
                />
              </TouchableOpacity>
            )
          )
        )}
      </View>
    </View>
  );
};

export default ModalHeader;

