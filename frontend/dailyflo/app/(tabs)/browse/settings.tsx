/**
 * Browse Settings Screen
 *
 * Settings screen accessible from the cog icon in the browse screen header.
 * ios: native Stack.Toolbar close (xmark) + headerTitle "Settings" (same pattern as list-create).
 * android: glass MainCloseButton + in-screen title row in overlay (stack header hidden).
 * Sections: Account/Calendar, Productivity, Personalization, Support, Logout.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, router as expoRouter, type Href } from 'expo-router';
import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import {
  SFSymbolIcon,
  BellIcon,
  GearIcon,
  CalendarIcon,
  SparklesIcon,
} from '@/components/ui/Icon';
import { useColorPalette, useSemanticColors, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton } from '@/components/ui/Button';
import { IosBrowseModalCloseStackToolbar } from '@/components/navigation/IosBrowseModalStackToolbars';
import { Paddings } from '@/constants/Paddings';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/slices/auth/authSlice';
import { useSettingsScheduleTimeSelect } from '@/app/SettingsScheduleSelectContext';
import {
  coerceWakeSleepHHMM,
  DEFAULT_SLEEP_HHMM,
  DEFAULT_WAKE_HHMM,
  formatWakeSleepLabel,
  hhmmLocalToReferenceDate,
} from '@/utils/preferenceScheduleTimes';

const WAKE_TIME_SELECT_HREF = '/(tabs)/browse/wake-time-select' as Href;
const SLEEP_TIME_SELECT_HREF = '/(tabs)/browse/sleep-time-select' as Href;
const NAVIGATION_SETTINGS_HREF = '/(tabs)/browse/navigation' as Href;

// header row height matches close button (42) – same as Activity Log
const HEADER_ROW_HEIGHT = 42;
// top spacing matches left spacing (Paddings.screen) for visual balance
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

export default function BrowseSettingsScreen() {
  const dispatch = useAppDispatch();
  const router = useGuardedRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const { getMarpleBrandColor } = useColorPalette();
  const typography = useTypography();
  const loggedInPrefs = useAppSelector((state) => state.auth.user?.preferences);
  // email from redux matches the jwt-backed session — show under logout so the user sees which account signs out (same pattern as system settings apps)
  const accountEmail = useAppSelector((state) => state.auth.user?.email);
  // true while wake/sleep sheet is saving — disables rows so user cannot open a second picker mid-patch
  const isSavingSchedulePrefs = useAppSelector((state) => state.auth.isUpdatingProfile);
  const { openScheduleTimeSelect } = useSettingsScheduleTimeSelect();
  // leading icons in grouped lists — same marple accent as browse home / chrome (logout row keeps semantic red below)
  const settingsGroupedListIconColor = getMarpleBrandColor(500);
  // shared token for destructive row — semantic error ramp, not body text
  const logoutDestructiveColor = semanticColors.error();
  const styles = createStyles(themeColors, typography);
  const headerHeight = useHeaderHeight();
  // same as list-create: one style object for ios native headerTitle + android overlay <Text>
  const headerTitleStyle = useMemo(
    () => ({
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    }),
    [typography, themeColors]
  );
  const topSectionHeight =
    Platform.OS === 'ios' ? headerHeight + FADE_OVERFLOW : TOP_SECTION_HEIGHT;
  const scrollPaddingTop =
    Platform.OS === 'ios' ? headerHeight + 24 : HEADER_TOP + HEADER_ROW_HEIGHT + 24;

  const listStyle = {
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    separatorColor: themeColors.border.primary(),
    containerStyle: styles.listContainer,
  };

  // full sign-out path lives in redux: `logoutUser` clears securestore tokens, auth slice, tasks, and onboarding flag
  const handleConfirmLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      // peel browse/settings first (back → browse index or replace browse root). `logoutUser` then queues today+auth via expo-router's global routing queue (see `queueLogoutAuthNavigation`).
      const canPopSettings = expoRouter.canGoBack();
      if (canPopSettings) {
        expoRouter.back();
      } else {
        expoRouter.replace('/(tabs)/browse' as Href);
      }
      // brief gap so browse stack commits after closing settings modal before thunk enqueues replace/push onto the root stack
      await new Promise((resolve) => setTimeout(resolve, 50));
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  }, [dispatch]);

  // if native stack loses `back()` target (broken history), flatten to browse home instead of crashing on GO_BACK
  const handleCloseSettings = useCallback(() => {
    const canPop =
      typeof (router as { canGoBack?: () => boolean }).canGoBack === 'function' &&
      (router as { canGoBack: () => boolean }).canGoBack();
    if (canPop) {
      router.back();
    } else {
      router.replace('/(tabs)/browse' as Href);
    }
  }, [router]);

  const handleLogoutPress = useCallback(() => {
    if (loggingOut) return;
    Alert.alert(
      'Log out?',
      "You'll need to sign in again to sync your tasks.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => void handleConfirmLogout() },
      ],
    );
  }, [handleConfirmLogout, loggingOut]);

  const wakeDisplayLabel = useMemo(
    () =>
      formatWakeSleepLabel(
        coerceWakeSleepHHMM(loggedInPrefs?.wakeTime, DEFAULT_WAKE_HHMM),
        DEFAULT_WAKE_HHMM,
        loggedInPrefs?.timeFormat ?? '12h',
      ),
    [loggedInPrefs?.timeFormat, loggedInPrefs?.wakeTime],
  );

  const sleepDisplayLabel = useMemo(
    () =>
      formatWakeSleepLabel(
        coerceWakeSleepHHMM(loggedInPrefs?.sleepTime, DEFAULT_SLEEP_HHMM),
        DEFAULT_SLEEP_HHMM,
        loggedInPrefs?.timeFormat ?? '12h',
      ),
    [loggedInPrefs?.timeFormat, loggedInPrefs?.sleepTime],
  );

  // push glass stack sheets (same pattern as planner month-select) — payload lives in SettingsScheduleSelectContext
  const openWakePicker = useCallback(() => {
    if (!loggedInPrefs) return;
    openScheduleTimeSelect({
      kind: 'wake',
      draftTime: hhmmLocalToReferenceDate(
        coerceWakeSleepHHMM(loggedInPrefs.wakeTime, DEFAULT_WAKE_HHMM),
        DEFAULT_WAKE_HHMM,
      ),
      wakeTime: loggedInPrefs.wakeTime,
      sleepTime: loggedInPrefs.sleepTime,
    });
    router.push(WAKE_TIME_SELECT_HREF);
  }, [loggedInPrefs, openScheduleTimeSelect, router]);

  const openSleepPicker = useCallback(() => {
    if (!loggedInPrefs) return;
    openScheduleTimeSelect({
      kind: 'sleep',
      draftTime: hhmmLocalToReferenceDate(
        coerceWakeSleepHHMM(loggedInPrefs.sleepTime, DEFAULT_SLEEP_HHMM),
        DEFAULT_SLEEP_HHMM,
      ),
      wakeTime: loggedInPrefs.wakeTime,
      sleepTime: loggedInPrefs.sleepTime,
    });
    router.push(SLEEP_TIME_SELECT_HREF);
  }, [loggedInPrefs, openScheduleTimeSelect, router]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {/* ios: native title next to Stack.Toolbar xmark — style matches list-create (heading-4) */}
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerTitle: 'Settings',
            headerTitleStyle,
            headerLargeTitle: false,
          }}
        />
      ) : null}
      <IosBrowseModalCloseStackToolbar onPress={handleCloseSettings} />
      {/* content first (behind) – scrollable settings sections */}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            // ios: below native modal header; android: below glass close + title row
            { paddingTop: scrollPaddingTop },
          ]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.contentWrapper}>
          <View style={styles.groupedListSection}>
            <GroupedList
              containerStyle={listStyle.containerStyle}
              backgroundColor={listStyle.backgroundColor}
              separatorColor={listStyle.separatorColor}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="account"
                iconComponent={
                  <SFSymbolIcon
                    name="person.circle"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Account"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="calendar"
                iconComponent={
                  <SFSymbolIcon
                    name="calendar"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<CalendarIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Calendar"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="wake"
                iconComponent={
                  <SFSymbolIcon
                    name="sun.horizon.fill"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<SparklesIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Wake up"
                value={wakeDisplayLabel}
                onPress={openWakePicker}
                disabled={!loggedInPrefs || isSavingSchedulePrefs}
                showChevron={true}
              />
              <FormDetailButton
                key="sleep"
                iconComponent={
                  <SFSymbolIcon
                    name="moon.zzz.fill"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<SparklesIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Sleep"
                value={sleepDisplayLabel}
                onPress={openSleepPicker}
                disabled={!loggedInPrefs || isSavingSchedulePrefs}
                showChevron={true}
              />
            </GroupedList>
          </View>

          <GroupedListHeader title="Productivity" style={styles.sectionHeader} />
          <View style={styles.groupedListSection}>
            <GroupedList
              containerStyle={listStyle.containerStyle}
              backgroundColor={listStyle.backgroundColor}
              separatorColor={listStyle.separatorColor}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="goals"
                iconComponent={
                  <SFSymbolIcon
                    name="target"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<SparklesIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Goals"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="reminders"
                iconComponent={
                  <SFSymbolIcon
                    name="bell.badge"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<BellIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Reminders"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="notifications"
                iconComponent={
                  <SFSymbolIcon
                    name="bell"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<BellIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Notifications"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          <GroupedListHeader title="Personalization" style={styles.sectionHeader} />
          <View style={styles.groupedListSection}>
            <GroupedList
              containerStyle={listStyle.containerStyle}
              backgroundColor={listStyle.backgroundColor}
              separatorColor={listStyle.separatorColor}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="theme"
                iconComponent={
                  <SFSymbolIcon
                    name="paintbrush"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Theme"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="navigation"
                iconComponent={
                  <SFSymbolIcon
                    name="square.grid.2x2"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Navigation"
                value=""
                onPress={() => router.push(NAVIGATION_SETTINGS_HREF)}
                showChevron={true}
              />
              <FormDetailButton
                key="app-icon"
                iconComponent={
                  <SFSymbolIcon
                    name="app.badge"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="App Icon"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          <GroupedListHeader title="Support" style={styles.sectionHeader} />
          <View style={styles.groupedListSection}>
            <GroupedList
              containerStyle={listStyle.containerStyle}
              backgroundColor={listStyle.backgroundColor}
              separatorColor={listStyle.separatorColor}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="about"
                iconComponent={
                  <SFSymbolIcon
                    name="info.circle"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="About"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="help-feedback"
                iconComponent={
                  <SFSymbolIcon
                    name="bubble.left.and.bubble.right"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Help and Feedback"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="whats-new"
                iconComponent={
                  <SFSymbolIcon
                    name="sparkles"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<SparklesIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="What's New"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="sync"
                iconComponent={
                  <SFSymbolIcon
                    name="arrow.triangle.2.circlepath"
                    size={18}
                    color={settingsGroupedListIconColor}
                    fallback={<GearIcon size={18} color={settingsGroupedListIconColor} />}
                  />
                }
                label="Sync"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          {/* logout: its own card so it matches other settings blocks (same radius, separator chrome — one row, no chevron) */}
          <View style={[styles.groupedListSection, styles.logoutGroupedListSection]}>
            <GroupedList
              containerStyle={listStyle.containerStyle}
              backgroundColor={listStyle.backgroundColor}
              separatorColor={listStyle.separatorColor}
              separatorInsetRight={Paddings.groupedListContentHorizontal}
              separatorVariant="solid"
              borderRadius={24}
              minimalStyle={false}
              separatorConsiderIconColumn={true}
              iconColumnWidth={30}
            >
              <FormDetailButton
                key="logout"
                iconComponent={
                  <SFSymbolIcon
                    name="rectangle.portrait.and.arrow.right"
                    size={18}
                    color={logoutDestructiveColor}
                    fallback={<GearIcon size={18} color={logoutDestructiveColor} />}
                  />
                }
                label="Logout"
                value=""
                onPress={handleLogoutPress}
                disabled={loggingOut}
                showChevron={false}
                customStyles={{ label: { color: logoutDestructiveColor } }}
              />
            </GroupedList>
            {accountEmail ? (
              <Text
                style={styles.signedInEmailCaption}
                numberOfLines={2}
                ellipsizeMode="middle"
              >
                {`Logged in with: ${accountEmail}`}
              </Text>
            ) : null}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
        </ScrollView>
      </View>

      {/* header on top: gradient + close button + title – same as Activity Log */}
      <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
        <View style={[styles.topSectionAnchor, { height: topSectionHeight }]}>
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              themeColors.background.primary(),
              themeColors.withOpacity(themeColors.background.primary(), 0),
            ]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        {Platform.OS === 'android' ? (
          <>
            <View style={[styles.headerRow, { top: HEADER_TOP }]} pointerEvents="box-none">
              <View style={styles.headerPlaceholder} pointerEvents="none" />
              <View style={styles.headerCenter} pointerEvents="none">
                <Text style={headerTitleStyle}>Settings</Text>
              </View>
              <View style={styles.headerPlaceholder} pointerEvents="none" />
            </View>
            <View style={styles.closeButtonContainer} pointerEvents="box-none">
              <MainCloseButton
                onPress={handleCloseSettings}
                top={Paddings.screen}
                left={Paddings.screen}
              />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentArea: {
      flex: 1,
      zIndex: 0,
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
      overflow: 'hidden',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
    },
    headerRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: HEADER_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
      zIndex: 10,
    },
    headerPlaceholder: {
      width: 44,
      height: 44,
    },
    headerCenter: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: TOP_SECTION_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    contentWrapper: {
      paddingHorizontal: 0, // scrollContent already has horizontal padding
    },
    groupedListSection: {
      paddingTop: 0,
    },
    sectionHeader: {
      marginTop: 24,
    },
    listContainer: {
      marginVertical: 0,
    },
    logoutGroupedListSection: {
      marginTop: 24,
    },
    signedInEmailCaption: {
      marginTop: 10,
      textAlign: 'center',
      ...typography.getTextStyle('body-small'),
      // heavier than secondary so the account line stays readable — still caption-sized, not a title
      color: themeColors.text.secondary(),
    },
    bottomSpacer: {
      height: 200,
    },
  });
