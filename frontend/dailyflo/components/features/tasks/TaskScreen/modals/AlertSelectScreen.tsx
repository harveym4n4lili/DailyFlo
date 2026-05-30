/**
 * Alert select screen content. Used by app/alert-select (root-level route).
 * Draft via CreateTaskDraftProvider — shows saved alerts with delete; Add Alert opens offset picker.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { MainCloseButton } from '@/components/ui/Button';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle, getTypographyStyle } from '@/constants/Typography';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { canTaskHaveAlertReminders } from '@/services/notifications/taskReminderEligibility';
import { BellIcon, ClockIcon, SFSymbolIcon, TrashIcon } from '@/components/ui/Icon';
import { GroupedList } from '@/components/ui/List/GroupedList';
import { Paddings } from '@/constants/Paddings';
import {
  getAlertRowDisplay,
  sortAlertIdsForDisplay,
  withoutEndAlertUnlessDuration,
} from './alertOptions';
import {
  ALERT_SHEET_CLOSE_TOP,
  ALERT_SHEET_HEADER_TRAILING_INSET,
  ALERT_SHEET_HORIZONTAL_INSET,
  ALERT_SHEET_SCROLL_PADDING_TOP,
} from './alertSheetChrome';

const ALERTS_HEADING_GAP = Paddings.listItemVertical + Paddings.groupedListHeaderContentGap;
const GROUPED_LIST_ICON_SIZE = 18;
const DELETE_ICON_SIZE = 20;
const GHOST_LABEL_OPACITY = 0.55;

/** one saved alert row — leading icon + label + delete */
function AlertSavedRow({
  alertId,
  iconColor,
  labelColor,
  labelOpacity = 1,
  ghosted = false,
  onDelete,
}: {
  alertId: string;
  iconColor: string;
  labelColor: string;
  labelOpacity?: number;
  ghosted?: boolean;
  onDelete: () => void;
}) {
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const themeColors = useThemeColors();
  const display = getAlertRowDisplay(alertId);

  return (
    <View style={styles.optionRow}>
      <View style={styles.leadingIconWrap}>
        <SFSymbolIcon
          name={display.sfSymbol}
          size={GROUPED_LIST_ICON_SIZE}
          color={iconColor}
          fallback={
            display.ionicon === 'time' ? (
              <ClockIcon size={GROUPED_LIST_ICON_SIZE} color={iconColor} isSolid />
            ) : (
              <Ionicons name={display.ionicon} size={GROUPED_LIST_ICON_SIZE} color={iconColor} />
            )
          }
        />
      </View>

      <Text
        style={[
          getTypographyStyle('body-large', typographyPlatform),
          styles.label,
          { color: labelColor, opacity: labelOpacity },
        ]}
      >
        {display.label}
      </Text>

      {ghosted ? null : (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDelete();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${display.label}`}
        >
          <SFSymbolIcon
            name="trash.fill"
            size={DELETE_ICON_SIZE}
            color={themeColors.text.tertiary()}
            fallback={<TrashIcon size={DELETE_ICON_SIZE} color={themeColors.text.tertiary()} />}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

/** empty grouped list row when user removed every alert */
function AlertEmptyRow({
  iconColor,
  labelColor,
  labelOpacity = 1,
}: {
  iconColor: string;
  labelColor: string;
  labelOpacity?: number;
}) {
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const themeColors = useThemeColors();

  return (
    <View style={styles.optionRow} accessibilityRole="text" accessibilityLabel="No alerts">
      <View style={styles.leadingIconWrap}>
        <SFSymbolIcon
          name="bell.fill"
          size={GROUPED_LIST_ICON_SIZE}
          color={iconColor}
          fallback={
            <BellIcon size={GROUPED_LIST_ICON_SIZE} color={iconColor} isSolid />
          }
        />
      </View>
      <Text
        style={[
          getTypographyStyle('body-large', typographyPlatform),
          styles.label,
          { color: labelColor, opacity: labelOpacity },
        ]}
      >
        No alerts
      </Text>
    </View>
  );
}

export function AlertSelectScreen() {
  const typographyPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const { draft, setAlerts } = useCreateTaskDraft();

  // alerts only work when the task has both a due day and a start time
  const canConfigureAlerts = canTaskHaveAlertReminders(draft.dueDate, draft.time);
  const alertIconColor = getMarpleBrandColor(500);
  const ghostIconColor = themeColors.text.tertiary();
  const ghostLabelColor = themeColors.text.tertiary();
  const rowIconColor = canConfigureAlerts ? alertIconColor : ghostIconColor;
  const rowLabelColor = canConfigureAlerts ? themeColors.text.secondary() : ghostLabelColor;
  const rowLabelOpacity = canConfigureAlerts ? 1 : GHOST_LABEL_OPACITY;

  const savedAlerts = useMemo(
    () => sortAlertIdsForDisplay(withoutEndAlertUnlessDuration(draft.alerts ?? [], draft.duration)),
    [draft.alerts, draft.duration],
  );

  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.secondary();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleDeleteAlert = (alertId: string) => {
    if (!canConfigureAlerts) return;
    setAlerts((draft.alerts ?? []).filter((id) => id !== alertId));
  };

  const handleAddAlertPress = () => {
    if (!canConfigureAlerts) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/alert-offset-select');
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: ALERT_SHEET_SCROLL_PADDING_TOP,
            paddingBottom: insets.bottom + Paddings.modalBottomExtra,
            paddingHorizontal: ALERT_SHEET_HORIZONTAL_INSET,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.alertsSection}>
          <Text
            style={[
              getTypographyStyle('heading-3', typographyPlatform),
              styles.alertsHeading,
              {
                color: themeColors.text.primary(),
                paddingRight: ALERT_SHEET_HEADER_TRAILING_INSET,
              },
            ]}
            accessibilityRole="header"
            accessibilityLabel="Alerts"
          >
            Alerts
          </Text>

          <GroupedList
            containerStyle={styles.listContainer}
            backgroundColor={themeColors.background.primarySecondaryBlend()}
            separatorColor={themeColors.border.primary()}
            separatorInsetRight={Paddings.groupedListContentHorizontal}
            separatorVariant="solid"
            borderRadius={24}
            minimalStyle={false}
            separatorConsiderIconColumn
            iconColumnWidth={30}
          >
            {savedAlerts.length === 0 ? (
              <AlertEmptyRow
                iconColor={rowIconColor}
                labelColor={rowLabelColor}
                labelOpacity={rowLabelOpacity}
              />
            ) : (
              savedAlerts.map((alertId) => (
                <AlertSavedRow
                  key={alertId}
                  alertId={alertId}
                  iconColor={rowIconColor}
                  labelColor={rowLabelColor}
                  labelOpacity={rowLabelOpacity}
                  ghosted={!canConfigureAlerts}
                  onDelete={() => handleDeleteAlert(alertId)}
                />
              ))
            )}
          </GroupedList>

          <View style={styles.addAlertPillRow}>
            <Pressable
              style={styles.formDataPillTapArea}
              hitSlop={{
                top: Paddings.touchTarget,
                bottom: Paddings.touchTarget,
                left: Paddings.touchTarget,
                right: Paddings.touchTarget,
              }}
              onPress={handleAddAlertPress}
              disabled={!canConfigureAlerts}
              accessibilityRole="button"
              accessibilityLabel="Add Alert"
              accessibilityState={{ disabled: !canConfigureAlerts }}
            >
              <View
                style={[
                  styles.formDataPill,
                  { backgroundColor: themeColors.background.primarySecondaryBlend() },
                  !canConfigureAlerts ? styles.formDataPillGhosted : null,
                ]}
              >
                <SFSymbolIcon
                  name="bell.fill"
                  size={18}
                  color={rowIconColor}
                  fallback={
                    <View style={styles.formDataPillIcon}>
                      <BellIcon size={18} color={rowIconColor} isSolid />
                    </View>
                  }
                  style={styles.formDataPillIcon}
                />
                <Text
                  style={[
                    styles.formDataPillText,
                    {
                      color: canConfigureAlerts ? themeColors.text.primary() : ghostLabelColor,
                      opacity: rowLabelOpacity,
                    },
                  ]}
                >
                  Add Alert
                </Text>
              </View>
            </Pressable>
          </View>

          {!canConfigureAlerts ? (
            <Text
              style={[
                getTypographyStyle('body-medium', typographyPlatform),
                styles.alertsHelperText,
                { color: themeColors.text.primary() },
              ]}
            >
              Please add a{' '}
              <Text style={{ color: alertIconColor }}>day</Text>
              {' '}and a{' '}
              <Text style={{ color: alertIconColor }}>time</Text>
              {' '}to the task.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.headerOverlay} pointerEvents="box-none">
        <MainCloseButton
          onPress={handleClose}
          top={ALERT_SHEET_CLOSE_TOP}
          right={ALERT_SHEET_HORIZONTAL_INSET}
          iconEmphasis="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  alertsSection: { width: '100%' },
  alertsHeading: {
    marginBottom: ALERTS_HEADING_GAP,
  },
  listContainer: { marginVertical: 0 },
  addAlertPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: Paddings.formDataPillRowGap,
  },
  formDataPillTapArea: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 48,
  },
  formDataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Paddings.formDataPillVertical,
    paddingHorizontal: Paddings.formDataPillHorizontal,
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',
  },
  formDataPillIcon: {
    marginRight: Paddings.formDataPillIconGap,
  },
  formDataPillText: {
    ...getTextStyle('body-large'),
  },
  formDataPillGhosted: {
    opacity: GHOST_LABEL_OPACITY,
  },
  alertsHelperText: {
    marginTop: Paddings.formDataPillRowGap,
    lineHeight: 22,
  },
  optionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadingIconWrap: {
    marginRight: Paddings.groupedListIconTextSpacing,
  },
  label: {
    flex: 1,
    marginRight: Paddings.groupedListIconTextSpacing,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
