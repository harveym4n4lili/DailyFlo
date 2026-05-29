/**
 * single row inside the Navigation Bar grouped list — view mode (plain) or edit mode (delete + drag).
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { SFSymbolIcon } from '@/components/ui/Icon';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

import { NAV_TAB_REGISTRY, type NavTabKey } from './navigationTabRegistry';

const ROW_ICON_SIZE = 18;
const ACTION_COLUMN_WIDTH = 32;

export type NavigationTabRowProps = {
  tabKey: NavTabKey;
  iconColor: string;
  /** view mode — no delete/drag affordances */
  mode: 'view' | 'edit';
  /** edit mode — show trash on the left (never true for browse) */
  showDelete?: boolean;
  /** edit mode — long-press starts drag when provided */
  onLongPressDrag?: () => void;
  onDelete?: () => void;
  isDragActive?: boolean;
  /** bottom hairline between rows inside the grouped card */
  showSeparator?: boolean;
  separatorColor: string;
};

export function NavigationTabRow({
  tabKey,
  iconColor,
  mode,
  showDelete = false,
  onLongPressDrag,
  onDelete,
  isDragActive = false,
  showSeparator = false,
  separatorColor,
}: NavigationTabRowProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const meta = NAV_TAB_REGISTRY[tabKey];

  const labelStyle = {
    ...typography.getTextStyle('body-large'),
    fontFamily: getFontFamilyWithWeight('medium'),
    color: themeColors.text.primary(),
    flex: 1,
  };

  const content = (
    <View style={styles.rowInner}>
      {mode === 'edit' ? (
        <View style={styles.actionColumn}>
          {showDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${meta.label}`}
            >
              <Ionicons name="trash-outline" size={22} color={semanticColors.error()} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.iconColumn}>
        <SFSymbolIcon
          name={meta.sfSymbol as any}
          size={ROW_ICON_SIZE}
          color={iconColor}
          fallback={
            <Image
              source={meta.getIconSource()}
              style={[styles.fallbackIcon, { tintColor: iconColor }]}
              resizeMode="contain"
            />
          }
        />
      </View>

      <Text style={labelStyle} numberOfLines={1}>
        {meta.label}
      </Text>

      {mode === 'edit' && onLongPressDrag ? (
        <Pressable
          onLongPress={onLongPressDrag}
          delayLongPress={220}
          disabled={isDragActive}
          style={styles.actionColumn}
          accessibilityRole="button"
          accessibilityLabel={`Reorder ${meta.label}`}
        >
          <Ionicons name="reorder-three" size={22} color={themeColors.text.tertiary()} />
        </Pressable>
      ) : mode === 'edit' ? (
        <View style={styles.actionColumn} />
      ) : null}
    </View>
  );

  return (
    <View>
      <View style={styles.row}>{content}</View>
      {showSeparator ? (
        <View style={[styles.separator, { backgroundColor: separatorColor, marginLeft: Paddings.groupedListContentHorizontal + ROW_ICON_SIZE + Paddings.groupedListIconTextSpacing }]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Paddings.groupedListContentHorizontal,
    paddingVertical: Paddings.groupedListContentVertical,
    minHeight: 44,
    justifyContent: 'center',
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.groupedListIconTextSpacing,
  },
  actionColumn: {
    width: ACTION_COLUMN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconColumn: {
    width: ROW_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginRight: Paddings.groupedListContentHorizontal,
  },
});
