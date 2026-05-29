/**
 * edit-mode row for Navigation Bar grouped list — mirrors manage-lists drag/delete layout:
 * delete is a sibling Pressable (left); long-press on rowMain starts drag; handle is visual-only (right).
 * padding + separators come from NavigationSettingsScreen editRowContent / SolidSeparator.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SFSymbolIcon } from '@/components/ui/Icon';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';

import { NAV_TAB_REGISTRY, type NavTabKey } from './navigationTabRegistry';

const ROW_ICON_SIZE = Paddings.groupedListIconSize;
const DRAG_HANDLE_COLUMN = ROW_ICON_SIZE;
const EDIT_CHROME_DURATION_MS = 260;
const EDIT_CHROME_EASING = Easing.out(Easing.cubic);

export type NavigationTabRowProps = {
  tabKey: NavTabKey;
  iconColor: string;
  showDelete?: boolean;
  /** empty delete column so rows without trash (browse) stay aligned with deletable rows */
  reserveDeleteColumn?: boolean;
  /** from DraggableFlatList renderItem — wire to rowMain onLongPress */
  onDrag?: () => void;
  onDelete?: () => void;
  isDragActive?: boolean;
};

export function NavigationTabRow({
  tabKey,
  iconColor,
  showDelete = false,
  reserveDeleteColumn = false,
  onDrag,
  onDelete,
  isDragActive = false,
}: NavigationTabRowProps) {
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const meta = NAV_TAB_REGISTRY[tabKey];
  const tertiary = themeColors.text.tertiary();

  const labelStyle = {
    ...getTextStyle('body-large'),
    color: themeColors.text.primary(),
    flex: 1,
  };

  const hasEditChrome = showDelete || reserveDeleteColumn || Boolean(onDrag);
  const editChromeProgress = useSharedValue(0);

  // slide delete + drag columns in when edit mode mounts this row
  useEffect(() => {
    if (!hasEditChrome) {
      editChromeProgress.value = 0;
      return;
    }
    editChromeProgress.value = withTiming(1, {
      duration: EDIT_CHROME_DURATION_MS,
      easing: EDIT_CHROME_EASING,
    });
  }, [editChromeProgress, hasEditChrome]);

  const deleteSlotStyle = useAnimatedStyle(() => ({
    width: interpolate(editChromeProgress.value, [0, 1], [0, ROW_ICON_SIZE]),
    marginRight: interpolate(
      editChromeProgress.value,
      [0, 1],
      [0, Paddings.groupedListIconTextSpacing]
    ),
    opacity: editChromeProgress.value,
    // width-only clip for slide-in — row height comes from alignSelf stretch so icons are not cropped vertically
    overflow: 'hidden' as const,
  }));

  const dragSlotStyle = useAnimatedStyle(() => ({
    width: interpolate(editChromeProgress.value, [0, 1], [0, DRAG_HANDLE_COLUMN]),
    opacity: editChromeProgress.value,
    overflow: 'hidden' as const,
  }));

  return (
    <View style={styles.row}>
      {hasEditChrome ? (
        <Animated.View style={[styles.deletePressable, deleteSlotStyle]}>
          {showDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${meta.label}`}
              style={styles.deleteIconWrap}
            >
              <Ionicons name="trash-outline" size={ROW_ICON_SIZE} color={semanticColors.error()} />
            </Pressable>
          ) : (
            <View style={styles.deleteIconWrap} />
          )}
        </Animated.View>
      ) : null}

      <Pressable
        onLongPress={onDrag}
        delayLongPress={220}
        disabled={isDragActive || !onDrag}
        style={({ pressed }) => [
          styles.rowMain,
          pressed && !isDragActive ? styles.rowPressed : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={onDrag ? `Reorder ${meta.label}` : meta.label}
      >
        <View style={styles.iconWrap}>
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

        {onDrag ? (
          <Animated.View style={[styles.dragHandleColumn, dragSlotStyle]} pointerEvents="none">
            <Ionicons name="reorder-three" size={ROW_ICON_SIZE} color={tertiary} />
          </Animated.View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Paddings.groupedListIconTextSpacing,
  },
  rowPressed: {
    opacity: 0.85,
  },
  deletePressable: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackIcon: {
    width: ROW_ICON_SIZE,
    height: ROW_ICON_SIZE,
  },
  dragHandleColumn: {
    width: DRAG_HANDLE_COLUMN,
    height: DRAG_HANDLE_COLUMN,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationTabRow;
