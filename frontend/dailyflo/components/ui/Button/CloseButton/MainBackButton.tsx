/**
 * MainBackButton Component
 *
 * A back button component for screens that adapts its styling based on iOS version.
 * Same sizing and styling as MainCloseButton but uses SF back arrow (chevron.left).
 * For iOS 15+: displays circular back arrow with liquid glass (GlassView).
 * For older iOS/Android: displays circular back arrow with tertiary background.
 */

// REACT IMPORTS
import React from 'react';

// REACT NATIVE IMPORTS
import { Pressable, Text, Platform, useWindowDimensions, View } from 'react-native';

// EXPO VECTOR ICONS IMPORT
// ionicons: fallback on Android/Web where SF Symbols are not available
import { Ionicons } from '@expo/vector-icons';

// CUSTOM ICON IMPORTS
// SFSymbolIcon: SF Symbols on iOS (chevron.left = back arrow)
import { SFSymbolIcon } from '@/components/ui/icon';

// CONSTANTS IMPORTS
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

// CUSTOM HOOKS IMPORTS
import { useThemeColors } from '@/hooks/useColorPalette';

// EXPO GLASS EFFECT IMPORTS
// GlassView: native iOS UIVisualEffectView liquid glass (same pattern as MainCloseButton)
import GlassView from 'expo-glass-effect/build/GlassView';

// TYPES IMPORTS
import type { TaskColor } from '@/types';

export interface MainBackButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Task color for older iOS text button (kept for compatibility) */
  color?: TaskColor;
  /** Optional top position override (defaults to 20) */
  top?: number;
  /** Optional left position override (defaults to Paddings.screen) */
  left?: number;
  /** Optional right position override (if provided, left is ignored) */
  right?: number;
}

/**
 * MainBackButton – liquid glass back button, same sizing as MainCloseButton.
 * Uses SF chevron.left on iOS, Ionicons arrow-back on Android/Web.
 */
export const MainBackButton: React.FC<MainBackButtonProps> = ({
  onPress,
  color = 'blue',
  top,
  left = Paddings.screen,
  right,
}) => {
  const themeColors = useThemeColors();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const getIOSVersion = (): number => {
    if (Platform.OS !== 'ios') return 0;
    const version = Platform.Version as string;
    const majorVersion =
      typeof version === 'string'
        ? parseInt(version.split('.')[0], 10)
        : Math.floor(version as number);
    return majorVersion;
  };

  const isNewerIOS = getIOSVersion() >= 15;
  const iconColor = themeColors.text.primary();
  const closeButtonBackgroundColor = themeColors.background.primary();
  const topPosition = top !== undefined ? top : 20;
  const glassAvailable = Platform.OS === 'ios';

  const basePositionStyle = {
    position: 'absolute' as const,
    ...(right !== undefined ? { right } : { left }),
    top: topPosition,
    zIndex: 10,
  };

  const absoluteWrapperStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: windowWidth,
    height: windowHeight,
    zIndex: 10,
  };

  // liquid glass variant: same as MainCloseButton but with chevron.left
  if (isNewerIOS && glassAvailable) {
    return (
      <View pointerEvents="box-none" style={absoluteWrapperStyle}>
        <GlassView
          style={{
            ...basePositionStyle,
            width: 42,
            height: 42,
            borderRadius: 24,
            overflow: 'visible',
          }}
          tintColor={closeButtonBackgroundColor as any}
          glassEffectStyle="regular"
          isInteractive
        >
          <Pressable
            onPress={onPress}
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 0,
              borderColor: themeColors.border.primary(),
              borderRadius: 21,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SFSymbolIcon
              name="chevron.left"
              size={20}
              color={iconColor}
              fallback={<Ionicons name="arrow-back" size={24} color={iconColor} />}
            />
          </Pressable>
        </GlassView>
      </View>
    );
  }

  // fallback for Android, web, older iOS
  return (
    <View pointerEvents="box-none" style={absoluteWrapperStyle}>
      <Pressable
        onPress={onPress}
        style={{
          ...basePositionStyle,
          ...(isNewerIOS
            ? {
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: closeButtonBackgroundColor,
              }
            : {
                paddingHorizontal: Paddings.contextMenuHorizontal,
                paddingVertical: Paddings.contextMenuVertical,
                borderRadius: 20,
                backgroundColor: themeColors.interactive.primary(),
              }),
        }}
      >
        {isNewerIOS ? (
          <SFSymbolIcon
            name="chevron.left"
            size={20}
            color={iconColor}
            fallback={<Ionicons name="arrow-back" size={24} color={iconColor} />}
          />
        ) : (
          <Text style={{ ...getTextStyle('button-secondary'), color: '#FFFFFF' }}>
            Back
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default MainBackButton;
