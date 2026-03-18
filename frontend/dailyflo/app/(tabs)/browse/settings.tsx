/**
 * Browse Settings Screen
 *
 * Settings screen accessible from the cog icon in the browse screen header.
 * Header matches Today screen: blur + gradient, back button left, "Settings" title centered.
 * Sections: Account/Calendar, Productivity, Personalization, Support, Logout.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ScreenContainer } from '@/components';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/list/GroupedList';
import {
  SFSymbolIcon,
  BellIcon,
  GearIcon,
  CalendarIcon,
  SparklesIcon,
} from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/button';
import { Paddings } from '@/constants/Paddings';

// top section – matches Today screen (height 64 for anchor, 48 for row)
const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;

export default function BrowseSettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors, typography, insets);

  // back button: screen-relative top, centered in 48px row
  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  const listStyle = {
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    separatorColor: themeColors.border.primary(),
    containerStyle: styles.listContainer,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* top section – same as Today: blur + gradient, height insets.top + 64 */}
      <View
        style={[
          styles.topSectionAnchor,
          { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT },
        ]}
      >
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
        <View style={styles.topSectionRow} pointerEvents="box-none">
          {/* placeholder on left for back button (button rendered below) */}
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          {/* Settings title – centered, same as Today header */}
          <View style={styles.settingsHeader} pointerEvents="none">
            <Text
              style={[
                styles.settingsHeaderText,
                { color: themeColors.text.primary() },
              ]}
            >
              Settings
            </Text>
          </View>
          {/* placeholder on right to balance layout */}
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
        </View>
      </View>

      {/* back button – outside topSectionAnchor so liquid glass expansion is not clipped */}
      <View style={styles.backButtonContainer} pointerEvents="box-none">
        <MainBackButton
          onPress={() => router.back()}
          top={backButtonTop}
          left={Paddings.screen}
        />
      </View>

      {/* main content – scrollable settings sections */}
      <ScreenContainer
        scrollable={true}
        paddingHorizontal={0}
        paddingVertical={0}
        safeAreaTop={false}
        safeAreaBottom={false}
      >
        <View style={styles.contentWrapper}>
          {/* Settings: Account, Calendar */}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<CalendarIcon size={20} color={themeColors.text.primary()} />}
                  />
                }
                label="Calendar"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          {/* Productivity */}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<SparklesIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BellIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BellIcon size={20} color={themeColors.text.primary()} />}
                  />
                }
                label="Notifications"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          {/* Personalization */}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
                  />
                }
                label="Navigation"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
              <FormDetailButton
                key="app-icon"
                iconComponent={
                  <SFSymbolIcon
                    name="app.badge"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
                  />
                }
                label="App Icon"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          {/* Support */}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<SparklesIcon size={20} color={themeColors.text.primary()} />}
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
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
                  />
                }
                label="Sync"
                value=""
                onPress={() => {}}
                showChevron={true}
              />
            </GroupedList>
          </View>

          {/* Logout button */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <SFSymbolIcon
              name="rectangle.portrait.and.arrow.right"
              size={20}
              color={themeColors.text.primary()}
              fallback={<GearIcon size={20} color={themeColors.text.primary()} />}
            />
            <Text
              style={[styles.logoutButtonText, { color: themeColors.text.primary() }]}
            >
              Logout
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScreenContainer>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    // Settings title – centered like Today header (heading-3)
    settingsHeader: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsHeaderText: {
      ...typography.getTextStyle('heading-3'),
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    contentWrapper: {
      flex: 1,
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
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
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      borderRadius: 24,
      marginTop: 24,
      minHeight: 44,
    },
    logoutButtonText: {
      ...typography.getTextStyle('body-large'),
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    bottomSpacer: {
      height: 200,
    },
  });
