/**
 * WrappedFullScreenModal Component
 * 
 * A full-screen bottom sheet modal with rounded top corners.
 * Wrapped in React Native Modal component for native presentation.
 * Base modal component without keyboard logic - use KeyboardAnchoredContainer for keyboard positioning.
 * 
 * Features:
 * - Full-screen modal presentation
 * - Rounded top corners (iOS version-aware)
 * - Backdrop overlay with fade animation
 * - Backdrop tap-to-dismiss
 * - Theme-aware styling
 * 
 * Usage:
 * ```tsx
 * <WrappedFullScreenModal visible={visible} onClose={onClose}>
 *   <ScrollView>...</ScrollView>
 *   <KeyboardAnchoredContainer>
 *     <ActionButton />
 *   </KeyboardAnchoredContainer>
 * </WrappedFullScreenModal>
 * ```
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  DimensionValue,
  Animated,
  Platform,
  useWindowDimensions,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface WrappedFullScreenModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Border radius for top corners
   * @default 12 (will be overridden by iOS version logic)
   */
  borderRadius?: number;

  /**
   * Custom height for the modal
   * Can be a number (px) or string ('50%', '300', etc.)
   * If not provided, modal will use full screen height
   */
  height?: DimensionValue;

  /**
   * Whether to allow backdrop tap to dismiss
   * @default true
   */
  backdropDismiss?: boolean;

  /**
   * Custom background color override
   * If not provided, uses theme's primary background color
   */
  backgroundColor?: string;

  /**
   * Whether to show backdrop overlay
   * @default true
   */
  showBackdrop?: boolean;

  /**
   * Additional padding to add to bottom (for keyboard positioning)
   * Can be used for custom keyboard positioning scenarios
   * @default 0
   */
  additionalPaddingBottom?: number;

  /**
   * When true, content fills the screen edge-to-edge with no bottom safe area padding.
   * Use for fullscreen modals where you don't want a gap or line at the bottom.
   * @default false
   */
  fullScreen?: boolean;
}

/**
 * Get iOS version number for conditional styling
 */
const getIOSVersion = (): number => {
  if (Platform.OS !== 'ios') return 0;
  const version = Platform.Version as string;
  const majorVersion = typeof version === 'string'
    ? parseInt(version.split('.')[0], 10)
    : Math.floor(version as number);
  return majorVersion;
};

/**
 * Calculate border radius based on iOS version
 */
const getBorderRadius = (customBorderRadius?: number): number => {
  if (customBorderRadius !== undefined && customBorderRadius !== 12) {
    return customBorderRadius;
  }

  const iosVersion = getIOSVersion();
  if (iosVersion >= 15) {
    return 28; // iOS 15+ glass UI
  } else if (iosVersion > 0) {
    return 20; // iOS < 15
  } else {
    return customBorderRadius || 12; // Android/web default
  }
};

export const WrappedFullScreenModal: React.FC<WrappedFullScreenModalProps> = ({
  visible,
  onClose,
  children,
  borderRadius = 12,
  height,
  backdropDismiss = true,
  backgroundColor,
  showBackdrop = true,
  additionalPaddingBottom = 0,
  fullScreen = false,
}) => {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  // get color scheme for theme-aware blur tint
  const colorScheme = useColorScheme();

  // Backdrop opacity animation
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const prevVisibleRef = useRef(visible);
  const prevShowBackdrop = useRef(showBackdrop);

  // Animate backdrop opacity when modal opens/closes or showBackdrop changes
  useEffect(() => {
    if (visible && !prevVisibleRef.current && showBackdrop) {
      // Modal just opened - fade in backdrop
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (!visible && prevVisibleRef.current) {
      // Modal just closed - fade out backdrop
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else if (showBackdrop && !prevShowBackdrop.current) {
      // showBackdrop changed from false to true
      prevShowBackdrop.current = showBackdrop;
      requestAnimationFrame(() => {
        backdropOpacity.setValue(0);
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else if (!showBackdrop && prevShowBackdrop.current) {
      // showBackdrop changed from true to false
      prevShowBackdrop.current = showBackdrop;
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    prevVisibleRef.current = visible;
    if (showBackdrop === prevShowBackdrop.current) {
      prevShowBackdrop.current = showBackdrop;
    }
  }, [visible, showBackdrop, backdropOpacity]);

  const handleBackdropPress = () => {
    if (backdropDismiss) {
      onClose();
    }
  };

  const calculatedBorderRadius = getBorderRadius(borderRadius);
  // check if running on iOS 15+ for glassy edge effect
  const isNewerIOS = getIOSVersion() >= 15;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
      transparent={true}
    >
      {/* Backdrop overlay */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
            pointerEvents: showBackdrop ? 'auto' : 'none',
          },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdropPress}
          disabled={!showBackdrop}
        />
      </Animated.View>

      {/* Modal container */}
      <View
        style={[styles.modalContainer, { zIndex: 10001 }]}
        pointerEvents="box-none"
      >
        {/* Content wrapper */}
        <View
          style={[
            styles.contentContainer,
            {
              height: screenHeight,
              backgroundColor: 'transparent',
              position: 'absolute',
              bottom: 0,
              justifyContent: 'flex-end',
            },
          ]}
        >
          {/* Visible content wrapper */}
          <View
            style={[
              styles.visibleContentWrapper,
              {
                backgroundColor: backgroundColor || themeColors.background.primary(),
                borderTopLeftRadius: calculatedBorderRadius,
                borderTopRightRadius: calculatedBorderRadius,
                height: height || screenHeight,
                paddingBottom: fullScreen ? 0 : insets.bottom + additionalPaddingBottom,
              },
            ]}
          >
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10000,
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  contentContainer: {
    width: '100%',
  },
  visibleContentWrapper: {
    width: '100%',
    overflow: 'hidden',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative',
  },
});

export default WrappedFullScreenModal;

