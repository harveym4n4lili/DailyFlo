/**
 * Browse Settings Screen
 *
 * Settings screen accessible from the cog icon in the browse screen header.
 * Layout matches Activity Log: content first (behind), header overlay on top with
 * MainCloseButton left + centered "Settings" title. Blur + gradient.
 * Sections: Account/Calendar, Productivity, Personalization, Support, Logout.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
import { MainCloseButton } from '@/components/ui/button';
import { Paddings } from '@/constants/Paddings';

// header row height matches close button (42) – same as Activity Log
const HEADER_ROW_HEIGHT = 42;
// top spacing matches left spacing (Paddings.screen) for visual balance
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

export default function BrowseSettingsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const styles = createStyles(themeColors, typography);

  const contentTopPadding = HEADER_TOP + HEADER_ROW_HEIGHT;
  const topSectionHeight = TOP_SECTION_HEIGHT;
  // reduced top spacing so content sits closer to header
  const contentPaddingTop = contentTopPadding;

  const listStyle = {
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    separatorColor: themeColors.border.primary(),
    containerStyle: styles.listContainer,
  };

  const headerTitleStyle = {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {/* content first (behind) – scrollable settings sections */}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: HEADER_ROW_HEIGHT + 40 },
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
        <View
          style={[styles.headerRow, { top: HEADER_TOP }]}
          pointerEvents="box-none"
        >
          <View style={styles.headerPlaceholder} pointerEvents="none" />
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={headerTitleStyle}>Settings</Text>
          </View>
          <View style={styles.headerPlaceholder} pointerEvents="none" />
        </View>
        <View style={styles.closeButtonContainer} pointerEvents="box-none">
          <MainCloseButton
            onPress={() => router.back()}
            top={Paddings.screen}
            left={Paddings.screen}
          />
        </View>
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
