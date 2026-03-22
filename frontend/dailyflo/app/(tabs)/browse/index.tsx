/**
 * Browse Screen
 *
 * Displays grouped list sections for browsing tasks.
 * Structure matches Today and Planner screens:
 * - Top section with context menu in top right
 * - Primary background color
 * - Liquid glass search tab above grouped list (Inbox, Completed, Tags)
 * - Grouped list styling matches Task screen FormDetailSection (date, alert, time)
 *
 * layout: topSectionAnchor fixed at top (zIndex 10) with context menu; content scrolls below
 * grouped list: same as FormDetailSection - primarySecondaryBlend bg, solid separator, separator starts at text (iconColumnWidth 30)
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import GlassView from 'expo-glass-effect/build/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// layout and ui components
import { ScreenContainer } from '@/components';
import { ScreenHeaderActions } from '@/components/ui';
import { FloatingActionButton } from '@/components/ui/button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon, TickIcon, BrowseIcon, LeafIcon, PencilIcon } from '@/components/ui/icon';

// theme and typography
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';
import { EXAMPLE_LISTS } from './_data/exampleLists';

export default function BrowseScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors, typography, insets);

  // My Lists section expand/collapse - true = expanded (pills visible)
  const [isMyListsExpanded, setIsMyListsExpanded] = React.useState(true);

  return (
    <View style={{ flex: 1 }}>
      {/* top section - blur + gradient, fixed row for context menu (same as Today/Planner) */}
      <View style={[styles.topSectionAnchor, { height: insets.top + 48 }]}>
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
          {/* placeholder on left to keep context menu aligned right */}
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <ScreenHeaderActions
            variant="browse"
            onSettingsPress={() => router.push('/(tabs)/browse/settings')}
            style={styles.topSectionContextButton}
            tint="primary"
          />
        </View>
      </View>

      {/* main content - scrollable, primary background, grouped list at top with padding */}
      <ScreenContainer
        scrollable={true}
        paddingHorizontal={0}
        paddingVertical={0}
        safeAreaTop={false}
        safeAreaBottom={false}
      >
        <View style={styles.contentWrapper}>
          {/* liquid glass search tab - icon + text (no input) */}
          {Platform.OS === 'ios' ? (
            <GlassView
              style={styles.searchTab}
              glassEffectStyle="clear"
              tintColor={themeColors.background.primary() as any}
              isInteractive
            >
              <Pressable
                onPress={() => {
                  // placeholder - search functionality to be implemented
                }}
                style={styles.searchTabInner}
              >
                <SFSymbolIcon
                  name="magnifyingglass"
                  size={20}
                  color={themeColors.text.primary()}
                  fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                />
                <Text style={[styles.searchTabLabel, { color: themeColors.text.primary() }]}>
                  Tasks/Lists
                </Text>
              </Pressable>
            </GlassView>
          ) : (
            <TouchableOpacity
              style={[styles.searchTab, styles.searchTabAndroid, { backgroundColor: themeColors.background.primary() }]}
              onPress={() => {
                // placeholder - search functionality to be implemented
              }}
              activeOpacity={0.7}
            >
              <SFSymbolIcon
                name="magnifyingglass"
                size={20}
                color={themeColors.text.primary()}
                fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
              />
              <Text style={[styles.searchTabLabel, { color: themeColors.text.primary() }]}>
                Tasks/Lists
              </Text>
            </TouchableOpacity>
          )}

          {/* grouped list section - first list has manual 24px top spacing */}
          <View style={[styles.groupedListSection, styles.firstGroupedListSection]}>
            <GroupedList
              containerStyle={styles.listContainer}
              backgroundColor={themeColors.background.primarySecondaryBlend()}
              separatorColor={themeColors.border.primary()}
            separatorInsetRight={Paddings.groupedListContentHorizontal}
            separatorVariant="solid"
            borderRadius={24}
            minimalStyle={false}
            separatorConsiderIconColumn={true}
            iconColumnWidth={30}
          >
              <FormDetailButton
                key="inbox"
                iconComponent={
                  <SFSymbolIcon
                    name="tray.full"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                  />
                }
                label="Inbox"
                value=""
                onPress={() => router.push('/(tabs)/browse/inbox')}
                showChevron={false}
              />
              <FormDetailButton
                key="completed"
                iconComponent={
                  <SFSymbolIcon
                    name="checkmark.circle.fill"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<TickIcon size={18} color={themeColors.text.primary()} />}
                  />
                }
                label="Completed"
                value=""
                onPress={() => router.push('/(tabs)/browse/completed')}
                showChevron={false}
              />
              <FormDetailButton
                key="tags"
                iconComponent={
                  <SFSymbolIcon
                    name="tag"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                  />
                }
                label="Tags"
                value=""
                onPress={() => router.push('/(tabs)/browse/tags')}
                showChevron={false}
              />
            </GroupedList>
          </View>

          {/* My Lists section header - dropdown arrow toggles section (layout transition slides up like ListCard task removal) */}
          <GroupedListHeader
            title="My Lists"
            showDropdownArrow
            isExpanded={isMyListsExpanded}
            onPress={() => setIsMyListsExpanded((prev) => !prev)}
            style={styles.myListsHeader}
          />

          {/* pills section - entering/exiting works in ScrollView (layout transition does not) */}
          {isMyListsExpanded && (
            <Animated.View
              entering={FadeInUp.duration(200)}
              exiting={FadeOutUp.duration(200)}
              style={styles.listsPillsContainer}
            >
              <TouchableOpacity
                style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
                onPress={() => router.push('/(tabs)/browse/manage-lists')}
                activeOpacity={0.7}
              >
                <PencilIcon size={20} color={themeColors.text.primary()} />
                <Text
                  style={[styles.listPillName, styles.listPillNameBold, { color: themeColors.text.primary() }]}
                  numberOfLines={1}
                >
                  Manage Lists
                </Text>
              </TouchableOpacity>
              {EXAMPLE_LISTS.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
                  onPress={() =>
                    router.push(`/(tabs)/browse/list/${list.id}` as any)
                  }
                  activeOpacity={0.7}
                >
                  <LeafIcon size={20} color={themeColors.text.tertiary()} />
                  <Text
                    style={[styles.listPillName, { color: themeColors.text.primary() }]}
                    numberOfLines={1}
                  >
                    {list.name}
                  </Text>
                  <View style={styles.listPillCountGap} />
                  <Text style={[styles.listPillCount, { color: themeColors.text.secondary() }]}>
                    {list.metadata?.taskCount ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      </ScreenContainer>

      {/* FAB: opens list-create with openedFrom so that screen knows browse launched it (for save/back later) */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          left: 0,
          height: 120,
          zIndex: 20,
        }}
        pointerEvents="box-none"
      >
        <FloatingActionButton
          onPress={() =>
            router.push({
              pathname: '/(tabs)/browse/list-create' as any,
              params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },
            })
          }
          backgroundColor={themeColors.background.invertedPrimary()}
          iconColor={themeColors.text.invertedPrimary()}
          accessibilityLabel="Create new list"
          accessibilityHint="Opens the new list screen"
        />
      </View>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>
) =>
  StyleSheet.create({
    // top section anchor - blur + gradient, fixed row for context menu (matches Today/Planner)
    topSectionAnchor: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      overflow: 'hidden',
    },

    // row container for context menu - matches Today/Planner topSectionRow
    topSectionRow: {
      position: 'absolute',
      top: insets.top,
      left: 0,
      right: 0,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },

    // placeholder on left - keeps context menu aligned right
    topSectionPlaceholder: {
      width: 44,
      height: 44,
      marginRight: 'auto',
    },

    // context menu button - transparent bg to match Today screen
    topSectionContextButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
      backgroundColor: 'transparent',
    },

    // content wrapper - primary background, padding for grouped list
    // overflow: visible so liquid glass search tab expansion is not clipped
    contentWrapper: {
      flex: 1,
      paddingTop: insets.top + 48,
      paddingBottom: 120,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
    },

    // My Lists section header - 24px top padding to separate from grouped list above
    myListsHeader: {
      marginTop: 24,
    },

    // liquid glass search tab - pill above grouped list
    // overflow: visible so iOS GlassView expansion/blur can extend beyond bounds (matches ScreenContextButton)
    searchTab: {
      borderRadius: 20,
      overflow: 'visible',
      marginTop: 16,
    },
    searchTabInner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      minHeight: 44,
    },
    searchTabLabel: {
      ...typography.getTextStyle('body-large'),
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    searchTabAndroid: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      minHeight: 44,
    },

    // grouped list section - no top padding (first list adds it manually)
    groupedListSection: {
      paddingTop: 0,
    },
    // first grouped list only - 24px spacing above (search tab → list)
    firstGroupedListSection: {
      paddingTop: 24,
    },

    // list container - no extra margin (FormDetailSection uses marginVertical: 0)
    listContainer: {
      marginVertical: 0,
    },

    // lists as separated pills - gap between My Lists header and pills (matches header-to-list spacing)
    listsPillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingTop: Paddings.groupedListHeaderContentGap,
    },
    listPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.pillVertical,
      borderRadius: 24,
      minHeight: 44,
    },
    listPillName: {
      ...typography.getTextStyle('body-large'),
      marginLeft: Paddings.groupedListIconTextSpacing,
    },
    listPillNameBold: {
      fontWeight: '700',
    },
    listPillCountGap: {
      width: 12,
    },
    listPillCount: {
      ...typography.getTextStyle('body-large'),
    },
  });
