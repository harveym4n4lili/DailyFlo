/**
 * ActionContextMenu Component
 *
 * A 3-dot ellipsis button that opens a context menu with action items.
 * Same icon size (32) as ScreenContextButton. Uses GlassView on iOS for liquid glass.
 *
 * On iOS: uses @expo/ui/swift-ui ContextMenu with GlassView for native liquid glass.
 * On Android: uses DropdownList for menu overlay.
 *
 * Modular context menu for task actions (Activity log, Duplicate, Delete, etc.)
 */

import React, { useState } from 'react';
import {
  Pressable,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Host, ContextMenu, Button } from '@expo/ui/swift-ui';
import { DropdownList } from '@/components/ui/list';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface ActionContextMenuItem {
  id: string;
  label: string;
  onPress: () => void;
  /** when true, label is shown in red (e.g. Delete task) */
  destructive?: boolean;
  /** SF Symbol name for iOS context menu (e.g. "trash") */
  systemImage?: string;
  /** Ionicons name for Android dropdown (e.g. "trash-outline") - used when iconComponent not provided */
  icon?: string;
  /** custom icon render function for Android - receives color, returns ReactNode (e.g. TrashIcon) */
  iconComponent?: (color: string) => React.ReactNode;
}

export interface ActionContextMenuProps {
  /** menu items to show when button is pressed */
  items: ActionContextMenuItem[];
  /** optional style for the container (for positioning by parent) */
  style?: ViewStyle;
  /** optional accessibility label */
  accessibilityLabel?: string;
  /** optional top offset for Android dropdown anchor (default 60) */
  dropdownAnchorTopOffset?: number;
  /** optional right offset for Android dropdown anchor (default 20) */
  dropdownAnchorRightOffset?: number;
  /** optional icon color override (e.g. "white" for dark headers) */
  iconColor?: string;
  /** tint for liquid glass / Android background: "primary" (top section) or "elevated" (task screen) */
  tint?: 'primary' | 'elevated';
}

export function ActionContextMenu({
  items,
  style,
  accessibilityLabel = 'Actions',
  dropdownAnchorTopOffset = 60,
  dropdownAnchorRightOffset = 20,
  iconColor: iconColorProp,
  tint = 'primary',
}: ActionContextMenuProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const themeColors = useThemeColors();
  const iconColor = iconColorProp ?? themeColors.text.primary();
  const tintColor = tint === 'elevated' ? themeColors.background.primarySecondaryBlend() : themeColors.background.primary();

  const handleItemPress = (item: ActionContextMenuItem) => {
    item.onPress();
    setIsDropdownVisible(false);
  };

  // android: container with background (uses tint for consistency with iOS)
  const containerStyle = [
    styles.container,
    { backgroundColor: tintColor as any },
    style,
  ];

  if (Platform.OS === 'ios') {
    return (
      <View style={style}>
        <Host matchContents={false} style={styles.host}>
          <ContextMenu activationMethod="singlePress">
            <ContextMenu.Trigger>
              <GlassView
                style={styles.iosWrapper}
                glassEffectStyle="clear"
                tintColor={tintColor as any}
                isInteractive
              >
                <Pressable
                  style={styles.pressable}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={accessibilityLabel}
                  accessibilityRole="button"
                >
                  <Ionicons name="ellipsis-horizontal" size={32} color={iconColor} />
                </Pressable>
              </GlassView>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              {items.map((item) => (
                <Button
                  key={item.id}
                  onPress={() => item.onPress()}
                  role={item.destructive ? 'destructive' : undefined}
                  systemImage={item.systemImage as any}
                >
                  {item.label}
                </Button>
              ))}
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      </View>
    );
  }

  // Android: TouchableOpacity + DropdownList
  return (
    <View style={containerStyle}>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(true)}
        style={styles.touchable}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Ionicons name="ellipsis-horizontal" size={32} color={iconColor} />
      </TouchableOpacity>
      <DropdownList
        visible={isDropdownVisible}
        onClose={() => setIsDropdownVisible(false)}
        items={items.map((item) => ({
          id: item.id,
          label: item.label,
          onPress: () => handleItemPress(item),
          destructive: item.destructive,
          icon: item.icon,
          iconComponent: item.iconComponent,
        }))}
        anchorPosition="top-right"
        topOffset={dropdownAnchorTopOffset}
        rightOffset={dropdownAnchorRightOffset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosWrapper: {
    paddingVertical: 2,
    paddingHorizontal: 12,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  host: {
    alignSelf: 'flex-start',
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
