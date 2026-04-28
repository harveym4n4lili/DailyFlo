/**
 * ActionContextMenu — ellipsis that opens a native (ios) or dropdown (android) action menu.
 * ios: GlassView + swift-ui Menu. icon + trigger sizes come from @/constants/headerChromeIconScale (shared header chrome).
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
import {
  headerChromeActionMenuTriggerSizePx,
  headerChromeIconOnlyBoxPx,
  headerChromeIconSizePx,
} from '@/constants/headerChromeIconScale';

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
  /** optional: override headerChromeIconScale sizes (e.g. Stack.Toolbar slot uses a smaller host than sheet chrome) */
  ellipsisGlyphPx?: number;
  menuHostSizePx?: number;
  menuHitMinPx?: number;
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
  ellipsisGlyphPx,
  menuHostSizePx,
  menuHitMinPx,
}: ActionContextMenuProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const themeColors = useThemeColors();
  const tintColor =
    tint === 'elevated'
      ? themeColors.background.primarySecondaryBlend()
      : themeColors.background.primary();
  const iconColor = iconColorProp ?? themeColors.text.primary();
  const ellipsisPx = ellipsisGlyphPx ?? headerChromeIconSizePx();
  const triggerSize = menuHostSizePx ?? headerChromeActionMenuTriggerSizePx();
  const triggerOnlyMin = menuHitMinPx ?? headerChromeIconOnlyBoxPx();

  const handleItemPress = (item: ActionContextMenuItem) => {
    item.onPress();
    setIsDropdownVisible(false);
  };

  if (Platform.OS === 'ios') {
    // menu label is only visuals — Menu owns the tap target (single tap opens; ContextMenu would require long-press)
    const iconOnly = (
      <View style={[styles.pressable, noGlass && { minWidth: triggerOnlyMin, minHeight: triggerOnlyMin }]}>
        <EllipsisIcon size={ellipsisPx} color={iconColor} />
      </View>
    );
    const glassCircleStyle = {
      width: triggerSize,
      height: triggerSize,
      borderRadius: triggerSize / 2,
      overflow: 'visible' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };
    const menuLabel = noGlass ? (
      iconOnly
    ) : (
      <GlassView style={glassCircleStyle} glassEffectStyle="clear" tintColor={tintColor as any} isInteractive>
        {iconOnly}
      </GlassView>
    );
    return (
      // host merges parent style here so we do not wrap in an extra rn view (one layout root + swift tree)
      <Host
        matchContents={false}
        style={[{ width: triggerSize, height: triggerSize, alignSelf: 'flex-start', overflow: 'visible' }, style]}
      >
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
          {
            width: triggerSize,
            height: triggerSize,
            borderRadius: noGlass ? 0 : triggerSize / 2,
          },
          !noGlass && { backgroundColor: tintColor as string },
          noGlass && { minWidth: triggerOnlyMin, minHeight: triggerOnlyMin },
          style,
        ]}
        activeOpacity={0.7}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <EllipsisIcon size={ellipsisPx} color={iconColor} />
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

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
