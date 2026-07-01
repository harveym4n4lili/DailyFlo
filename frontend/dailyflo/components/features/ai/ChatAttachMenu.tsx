/**
 * chat composer attach control — primary[50] chip with brand marple + icon.
 * ios: native swift-ui Menu dropdown; android: DropdownList modal anchored bottom-left.
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  DynamicColorIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Host, Menu, Button } from '@expo/ui/swift-ui';
import { DropdownList } from '@/components/ui/List';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { CHAT_UTILITY_BUTTON_SIZE, getChatAttachChipColors } from './chatComposerUiTokens';

export interface ChatAttachMenuProps {
  /** dims the trigger when the chat is busy (same as send button) */
  disabled?: boolean;
}

export function ChatAttachMenu({ disabled = false }: ChatAttachMenuProps) {
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const [androidMenuVisible, setAndroidMenuVisible] = useState(false);

  const buttonSize = CHAT_UTILITY_BUTTON_SIZE;
  const buttonRadius = buttonSize / 2;
  const { background: attachButtonBackground, icon: brandIconColor } = getChatAttachChipColors(colors);
  const glassTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({ light: attachButtonBackground, dark: attachButtonBackground })
      : attachButtonBackground;
  const triggerOpacity = disabled ? 0.4 : 1;

  // placeholder — menu item closes the dropdown; image attach wired later
  const handleAddImage = () => {
    setAndroidMenuVisible(false);
  };

  const plusIcon = <Ionicons name="add" size={20} color={brandIconColor} />;

  const circleStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonRadius,
    opacity: triggerOpacity,
  };

  if (Platform.OS === 'ios') {
    // menu label is visuals only — Menu owns the tap target (same pattern as ActionContextMenu)
    const menuLabel = (
      <GlassView
        style={[styles.glassSurface, circleStyle]}
        glassEffectStyle="clear"
        tintColor={glassTint as any}
        isInteractive
      >
        <View style={[styles.glassSurfaceInner, { borderRadius: buttonRadius }]}>{plusIcon}</View>
      </GlassView>
    );

    return (
      <View style={styles.glassBleedSlot}>
        <Host
          matchContents={false}
          style={{
            width: buttonSize,
            height: buttonSize,
            overflow: 'visible',
          }}
        >
          <Menu label={menuLabel}>
            <Button
              label="Add image"
              systemImage="photo"
              onPress={handleAddImage}
            />
          </Menu>
        </Host>
      </View>
    );
  }

  // android/web: solid primary circle opens DropdownList above the bottom-left trigger
  return (
    <>
      <View style={styles.glassBleedSlot}>
        <TouchableOpacity
          style={[
            styles.androidFallback,
            circleStyle,
            {
              backgroundColor: attachButtonBackground,
              borderColor: themeColors.border.secondary(),
            },
          ]}
          onPress={() => {
            if (disabled) return;
            setAndroidMenuVisible(true);
          }}
          activeOpacity={0.85}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Add attachment"
          accessibilityHint="Opens menu to add an image"
        >
          {plusIcon}
        </TouchableOpacity>
      </View>
      <DropdownList
        visible={androidMenuVisible}
        onClose={() => setAndroidMenuVisible(false)}
        anchorPosition="bottom-left"
        leftOffset={Paddings.groupedListHeaderContentGap}
        items={[
          {
            id: 'add-image',
            label: 'Add image',
            icon: 'image-outline',
            onPress: handleAddImage,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  glassBleedSlot: {
    margin: -Paddings.liquidGlassBleed,
    padding: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
  glassSurface: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  glassSurfaceInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
