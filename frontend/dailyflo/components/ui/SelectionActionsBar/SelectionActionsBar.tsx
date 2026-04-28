/**
 * SelectionActionsBar - bottom bar that replaces the tab bar when in selection mode.
 * Today: 4 icon-only actions. Planner: Cancel + count (ios uses native bottom Stack.Toolbar on select routes).
 * Uses useTaskBulkSelectionActions for redux + navigation side effects.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';

import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { useTaskBulkSelectionActions } from '@/hooks/useTaskBulkSelectionActions';
import { useUI } from '@/store/hooks';

export interface SelectionActionsBarProps {
  onMoveComplete?: (date: string) => void;
  screen?: 'today' | 'planner' | 'other';
}

export function SelectionActionsBar(props: SelectionActionsBarProps) {
  const { screen } = props;
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const pathname = usePathname() ?? '';
  const { selection } = useUI();
  const { isSelectionMode, selectionType } = selection;
  const { hasSelection, selectedCount, handleCancel, handleComplete, handleDelete, handleMove } =
    useTaskBulkSelectionActions();

  const styles = React.useMemo(
    () => createStyles(themeColors, semanticColors, typography),
    [themeColors, semanticColors, typography],
  );

  if (!isSelectionMode || selectionType !== 'tasks') return null;

  // ios: native bottom Stack.Toolbar on select routes; date-select is root stack so segments lose "select" — still no overlay
  if (
    Platform.OS === 'ios' &&
    (pathname.includes('/today/select') ||
      pathname.includes('/planner/select') ||
      pathname.includes('/browse/task-select') ||
      pathname.includes('/date-select'))
  ) {
    return null;
  }

  const tintColor = themeColors.background.primary();
  const iconColorActive = '#FFFFFF';
  const iconColorDisabled = 'rgba(255,255,255,0.5)';
  const deleteIconColorActive = iconColorActive;

  const barContent =
    screen === 'planner' ? (
      <View style={styles.contentPlanner}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
          accessibilityLabel="Cancel selection"
          accessibilityRole="button"
        >
          <Text style={[styles.cancelText, { color: iconColorActive }]}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.countText, { color: iconColorActive }]}>
            {selectedCount} selected
          </Text>
        </View>
        <View style={styles.plannerToolbarSpacer} pointerEvents="none" />
      </View>
    ) : (
      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={() => void handleComplete()}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Complete selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="checkmark-done-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleMove}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Change date for selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="calendar-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleMove}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Move selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="arrow-redo-outline"
            size={24}
            color={hasSelection ? iconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, !hasSelection && styles.actionButtonDisabled]}
          onPress={handleDelete}
          disabled={!hasSelection}
          activeOpacity={0.7}
          accessibilityLabel="Delete selected tasks"
          accessibilityRole="button"
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color={hasSelection ? deleteIconColorActive : iconColorDisabled}
          />
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={[styles.container, { bottom: 20 }]}>
      {Platform.OS === 'ios' ? (
        <GlassView
          style={styles.glassWrapper}
          glassEffectStyle="regular"
          tintColor={tintColor as any}
          isInteractive
        >
          {barContent}
        </GlassView>
      ) : (
        barContent
      )}
    </View>
  );
}

function createStyles(
  themeColors: ReturnType<typeof useThemeColors>,
  semanticColors: ReturnType<typeof useSemanticColors>,
  typography: ReturnType<typeof useTypography>,
) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 4,
      right: 4,
      borderRadius: 20,
      overflow: Platform.OS === 'ios' ? 'visible' : 'hidden',
      justifyContent: 'center',
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : themeColors.background.primary(),
      borderWidth: Platform.OS === 'ios' ? 0 : 1,
      borderColor: themeColors.border.secondary(),
      paddingHorizontal: 16,
      zIndex: 100,
    },
    glassWrapper: {
      minHeight: 64,
      justifyContent: 'center',
      paddingHorizontal: 16,
      borderRadius: 35,
      overflow: 'visible',
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      gap: 8,
    },
    contentPlanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countText: {
      ...typography.getTextStyle('body-medium'),
    },
    plannerToolbarSpacer: {
      width: 60,
      marginLeft: 'auto',
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: 70,
      justifyContent: 'center',
    },
    cancelText: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '500',
    },
    actionButton: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
  });
}
