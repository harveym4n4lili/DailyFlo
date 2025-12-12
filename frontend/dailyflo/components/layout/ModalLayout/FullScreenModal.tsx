/**
 * FullScreenModal Component
 * 
 * A full-screen modal with slide-up animation and multi-modal layering support.
 * Uses Reanimated for smooth slide animations similar to DraggableModal.
 * Supports stacking multiple modals on top of each other with z-index control.
 * 
 * Features:
 * - Full-screen modal presentation
 * - Slide-up animation from bottom (iOS-style)
 * - Multi-modal layering support (z-index control)
 * - Backdrop overlay with fade animation
 * - Backdrop tap-to-dismiss
 * - Theme-aware styling
 * 
 * Usage:
 * ```tsx
 * <FullScreenModal visible={visible} onClose={onClose} zIndex={10002}>
 *   <ScrollView>...</ScrollView>
 * </FullScreenModal>
 * ```
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  DimensionValue,
  Platform,
  useWindowDimensions,
  useColorScheme,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useColorPalette';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export interface FullScreenModalProps {
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
   * z-index for modal stacking
   * Higher z-index modals appear on top of lower z-index modals
   * @default 10002 (higher than DraggableModal's default 10001)
   */
  zIndex?: number;
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

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  visible,
  onClose,
  children,
  borderRadius = 12,
  height,
  backdropDismiss = true,
  backgroundColor,
  showBackdrop = true,
  zIndex = 10002,
}) => {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();

  // Track if modal is animating out to handle cleanup
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const prevVisibleRef = useRef(visible);
  const backdropVisibleRef = useRef(visible);

  // Synchronously detect when visible changes
  const isTransitioningOut = prevVisibleRef.current && !visible;
  prevVisibleRef.current = visible;

  // Shared values for animations
  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  // Calculate border radius
  const calculatedBorderRadius = getBorderRadius(borderRadius);
  const isNewerIOS = getIOSVersion() >= 15;

  // Modal slide animation effect
  useEffect(() => {
    if (visible) {
      backdropVisibleRef.current = true;
      translateY.value = screenHeight;
      backdropOpacity.value = 0;

      requestAnimationFrame(() => {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        });
        backdropOpacity.value = withTiming(1, {
        duration: 300,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        });
      });

      setIsAnimatingOut(false);
    } else {
      if (!backdropVisibleRef.current) {
        setIsAnimatingOut(false);
        return;
      }

      setIsAnimatingOut(true);
      backdropVisibleRef.current = false;

      requestAnimationFrame(() => {
        backdropOpacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        });
        translateY.value = withTiming(screenHeight, {
          duration: 300,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        });
      });

      const timer = setTimeout(() => {
        setIsAnimatingOut(false);
        translateY.value = screenHeight;
        backdropOpacity.value = 0;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, screenHeight]);

  // Android back button handler
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  // Animated styles
  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  const handleBackdropPress = () => {
    if (backdropDismiss) {
      onClose();
    }
  };

  // Early return if not visible and not animating
  if (!visible && !isAnimatingOut) {
    return null;
  }

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { zIndex, pointerEvents: visible || isAnimatingOut ? 'auto' : 'none' },
      ]}
    >
      {/* Backdrop overlay */}
      {showBackdrop && (
      <Animated.View
        style={[
            StyleSheet.absoluteFillObject,
          styles.backdrop,
            backdropAnimatedStyle,
            { pointerEvents: showBackdrop ? 'auto' : 'none' },
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleBackdropPress}
          disabled={!showBackdrop}
        />
      </Animated.View>
      )}

      {/* Modal container */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { justifyContent: 'flex-end' },
          modalAnimatedStyle,
        ]}
        pointerEvents="box-none"
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
              paddingBottom: insets.bottom,
              },
            ]}
          >
            {children}
          </View>
      </Animated.View>
      </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  visibleContentWrapper: {
    width: '100%',
    overflow: 'hidden',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'relative',
  },
});

export default FullScreenModal;
