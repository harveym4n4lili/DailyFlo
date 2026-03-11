/**
 * Browse Screen
 *
 * Displays grouped list sections for browsing tasks.
 * Structure matches Today and Planner screens:
 * - Top section with context menu in top right
 * - Primary background color
 * - Grouped list at top with Search, Completed, and Lists buttons
 * - Grouped list styling matches Task screen FormDetailSection (date, alert, time)
 *
 * layout: topSectionAnchor fixed at top (zIndex 10) with context menu; content scrolls below
 * grouped list: same as FormDetailSection - primarySecondaryBlend bg, solid separator, separator starts at text (iconColumnWidth 30)
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// layout and ui components
import { ScreenContainer } from '@/components';
import { ScreenHeaderActions } from '@/components/ui';
import { GroupedList, FormDetailButton } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon } from '@/components/ui/icon';
import { TickIcon } from '@/components/ui/icon';
import { BrowseIcon } from '@/components/ui/icon';

// theme and typography
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';

export default function BrowseScreen() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = createStyles(themeColors, insets);

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
          {/* grouped list section - same styling as Task screen FormDetailSection (date, alert, time) */}
          <View style={styles.groupedListSection}>
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
                key="search"
                iconComponent={
                  <SFSymbolIcon
                    name="magnifyingglass"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                  />
                }
                label="Search"
                onPress={() => {
                  // placeholder - search functionality to be implemented
                }}
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
                onPress={() => {
                  // placeholder - completed tasks view to be implemented
                }}
                showChevron={false}
              />
              <FormDetailButton
                key="lists"
                iconComponent={
                  <SFSymbolIcon
                    name="list.bullet"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                  />
                }
                label="Lists"
                onPress={() => {
                  // placeholder - lists view to be implemented
                }}
                showChevron={false}
              />
            </GroupedList>
          </View>
        </View>
      </ScreenContainer>
    </View>
  );
}

const createStyles = (
  themeColors: ReturnType<typeof useThemeColors>,
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
    contentWrapper: {
      flex: 1,
      paddingTop: insets.top + 48,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
    },

    // grouped list section - padding around the list (matches FormDetailSection spacing)
    groupedListSection: {
      paddingTop: Paddings.touchTarget,
    },

    // list container - no extra margin (FormDetailSection uses marginVertical: 0)
    listContainer: {
      marginVertical: 0,
    },
  });
