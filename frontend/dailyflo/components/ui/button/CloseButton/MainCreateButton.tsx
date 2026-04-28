/**
 * MainCreateButton – same 42×42 liquid glass circle as MainCloseButton / MainBackButton / MainSubmitButton,
 * but shows a plus (create). use in modal headers when opening a “new item” flow (e.g. manage lists → new list).
 */

import React from 'react';
import { Pressable, Text, Platform, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import GlassView from 'expo-glass-effect/build/GlassView';
export interface MainCreateButtonProps {
  onPress: () => void;
  top?: number;
  left?: number;
  right?: number;
  accessibilityLabel?: string;
}

export const MainCreateButton: React.FC<MainCreateButtonProps> = ({
  onPress,
  top,
  left = Paddings.screen,
  right,
  accessibilityLabel = 'Create new list',
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
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
          >
            <SFSymbolIcon
              name="plus"
              size={22}
              color={iconColor}
              fallback={<Ionicons name="add" size={26} color={iconColor} />}
            />
          </Pressable>
        </GlassView>
      </View>
    );
  }

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
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {isNewerIOS ? (
          <SFSymbolIcon
            name="plus"
            size={22}
            color={iconColor}
            fallback={<Ionicons name="add" size={26} color={iconColor} />}
          />
        ) : (
          <Text style={{ ...getTextStyle('button-secondary'), color: '#FFFFFF' }}>Create</Text>
        )}
      </Pressable>
    </View>
  );
};

export default MainCreateButton;
