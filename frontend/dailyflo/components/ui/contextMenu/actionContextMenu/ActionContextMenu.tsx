/**
 * ActionContextMenu — ellipsis that opens a native (ios) or dropdown (android) action menu.
 * same 20px icon as grouped-list task rows (FormDetailButton); ios uses GlassView + swift-ui Menu.
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Platform,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { EllipsisIcon } from '@/components/ui/icon';
import { Host, Menu, Button } from '@expo/ui/swift-ui';
import { DropdownList } from '@/components/ui/list';
import { useThemeColors } from '@/hooks/useColorPalette';

export interface ActionContextMenuItem {
  id: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  systemImage?: string;
  icon?: string;
  iconComponent?: (color: string) => React.ReactNode;
}

export interface ActionContextMenuProps {
  items: ActionContextMenuItem[];
  style?: ViewStyle;
  accessibilityLabel?: string;
  dropdownAnchorTopOffset?: number;
  dropdownAnchorRightOffset?: number;
  iconColor?: string;
  /** primary = theme background.primary; elevated = primarySecondaryBlend (softer sheet-style surface) */
  tint?: 'primary' | 'elevated';
  noGlass?: boolean;
}

export function ActionContextMenu({
  items,
  style,
  accessibilityLabel = 'Actions',
  dropdownAnchorTopOffset = 60,
  dropdownAnchorRightOffset = 20,
  iconColor: iconColorProp,
  tint = 'primary',
  noGlass = false,
}: ActionContextMenuProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const themeColors = useThemeColors();
  const tintColor =
    tint === 'elevated'
      ? themeColors.background.primarySecondaryBlend()
      : themeColors.background.primary();
  const iconColor = iconColorProp ?? themeColors.text.primary();

  const handleItemPress = (item: ActionContextMenuItem) => {
    item.onPress();
    setIsDropdownVisible(false);
  };

  if (Platform.OS === 'ios') {
    // menu label is only visuals — Menu owns the tap target (single tap opens; ContextMenu would require long-press)
    const iconOnly = (
      <View style={[styles.pressable, noGlass && styles.triggerOnly]}>
        <EllipsisIcon size={20} color={iconColor} />
      </View>
    );
    const menuLabel = noGlass ? (
      iconOnly
    ) : (
      <GlassView
        style={styles.iosGlassCircle}
        glassEffectStyle="clear"
        tintColor={tintColor as any}
        isInteractive
      >
        {iconOnly}
      </GlassView>
    );
    return (
      // host merges parent style here so we do not wrap in an extra rn view (one layout root + swift tree)
      <Host matchContents={false} style={[styles.host, style]}>
        <Menu label={menuLabel}>
          {items.map((item) => (
            <Button
              key={item.id}
              onPress={() => item.onPress()}
              role={item.destructive ? 'destructive' : undefined}
              systemImage={item.systemImage as any}
              label={item.label}
            />
          ))}
        </Menu>
      </Host>
    );
  }

  // android: one touchable holds tint + circle (no outer view); dropdown is a modal so it always “overflows” the chip
  return (
    <>
      <TouchableOpacity
        onPress={() => setIsDropdownVisible(true)}
        style={[
          styles.touchable,
          !noGlass && styles.circleChrome,
          !noGlass && { backgroundColor: tintColor as string },
          noGlass && styles.triggerOnly,
          style,
        ]}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <EllipsisIcon size={20} color={iconColor} />
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
    </>
  );
}

// equal width/height + half borderRadius = circular glass / android chip (was 60×44 capsule)
const ACTION_MENU_TRIGGER_SIZE = 48;
const styles = StyleSheet.create({
  // shared circle geometry for ios glass + android tinted fallback
  circleChrome: {
    width: ACTION_MENU_TRIGGER_SIZE,
    height: ACTION_MENU_TRIGGER_SIZE,
    borderRadius: ACTION_MENU_TRIGGER_SIZE / 2,
  },
  iosGlassCircle: {
    width: ACTION_MENU_TRIGGER_SIZE,
    height: ACTION_MENU_TRIGGER_SIZE,
    borderRadius: ACTION_MENU_TRIGGER_SIZE / 2,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  },
  host: {
    alignSelf: 'flex-start',
    overflow: 'visible',
  },
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    width: ACTION_MENU_TRIGGER_SIZE,
    height: ACTION_MENU_TRIGGER_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  triggerOnly: {
    minWidth: 28,
    minHeight: 28,
  },
});
