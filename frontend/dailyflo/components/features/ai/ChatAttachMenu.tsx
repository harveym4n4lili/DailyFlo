/**
 * chat composer attach control — solid primary[50] circle with brand marple + icon.
 * ios: native swift-ui Menu dropdown; android: DropdownList modal anchored bottom-left.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    backgroundColor: attachButtonBackground,
    borderColor: themeColors.border.secondary(),
    opacity: triggerOpacity,
  };

  const attachTrigger = (
    <View style={[styles.circleButton, circleStyle]}>{plusIcon}</View>
  );

  if (Platform.OS === 'ios') {
    // menu label is visuals only — Menu owns the tap target (same pattern as ActionContextMenu)
    return (
      <Host
        matchContents={false}
        style={{
          width: buttonSize,
          height: buttonSize,
        }}
      >
        <Menu label={attachTrigger}>
          <Button label="Add image" systemImage="photo" onPress={handleAddImage} />
        </Menu>
      </Host>
    );
  }

  // android/web: solid circle opens DropdownList above the bottom-left trigger
  return (
    <>
      <TouchableOpacity
        style={[styles.circleButton, circleStyle]}
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
  circleButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
