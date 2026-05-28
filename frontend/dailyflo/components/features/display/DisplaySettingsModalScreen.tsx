/**
 * Display settings modal — list view vs timeline view, sort options, reset.
 * Same modal chrome as browse manage-lists / list-create:
 * ios: Stack.Toolbar xmark + marple glass apply; android: glass close + submit in overlay.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Alert, Switch } from 'react-native';
import Animated from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useColorPalette, useSemanticColors, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/Button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon, TickIcon } from '@/components/ui/Icon';
import { DisplayLayoutViewSelector } from '@/components/features/display/DisplayLayoutViewSelector';
import { DisplaySettingsAnimatedSection } from '@/components/features/display/DisplaySettingsAnimatedSection';
import { DISPLAY_SETTINGS_ROW_TO_ROUTE, type DisplaySettingsContext } from '@/components/features/display/displayStackChrome';
import { useDisplaySettingsDraft } from '@/components/features/display/DisplaySettingsDraftContext';
import { draftToDisplayPreferencesPatch } from '@/components/features/display/displayPreferenceDefaults';
import {
  shouldFilterBeforeSort,
  shouldShowDisplayAllDayToggle,
  shouldShowDisplaySortSection,
} from '@/components/features/display/displayModalSectionVisibility';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';
import { useAppDispatch, useAppSelector } from '@/store';
import { patchUserDisplayPreferences } from '@/store/slices/auth/authSlice';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

/** display picker rows — sort section vs filter section on the Display root */
type DisplaySettingsPickerRow = keyof typeof DISPLAY_SETTINGS_ROW_TO_ROUTE;

// display grouped lists: base icon size + extra, column width = icon + label gap (separator alignment)
const DISPLAY_GROUPED_LIST_ICON_SIZE =
  Paddings.groupedListIconSize + Paddings.displayGroupedListIconSizeExtra;
const DISPLAY_GROUPED_LIST_ICON_COLUMN_WIDTH =
  DISPLAY_GROUPED_LIST_ICON_SIZE + Paddings.groupedListIconTextSpacing;
// base GroupedList row v-padding + display-screen extra (see Paddings.groupedListContentVerticalExtra)
const DISPLAY_GROUPED_LIST_CONTENT_PADDING_VERTICAL =
  Paddings.groupedListContentVertical + Paddings.groupedListContentVerticalExtra;

export type { DisplaySettingsContext } from '@/components/features/display/displayStackChrome';

export type DisplaySettingsModalScreenProps = {
  context: DisplaySettingsContext;
};

export default function DisplaySettingsModalScreen({ context }: DisplaySettingsModalScreenProps) {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const isSaving = useAppSelector((s) => s.auth.isUpdatingProfile);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const { getMarpleBrandColor } = useColorPalette();
  const typography = useTypography();
  const styles = createStyles(typography);

  const groupedListIconColor = getMarpleBrandColor(500);
  const resetLabelColor = semanticColors.error();

  // shared draft across display root + sort pickers — save button lives on this screen only
  const {
    draft,
    hasChanges,
    setShowCompletedTasks,
    setShowAllDayTasks,
    resetAll,
  } = useDisplaySettingsDraft();

  const { layoutView, sortOption, orderingOption, prioritySortSublabel, showCompletedTasks, showAllDayTasks } =
    draft;

  // timeline: filters only until all-day is on — then sort section appears for the all-day list
  const showSortSection = shouldShowDisplaySortSection(layoutView, showAllDayTasks);
  const showAllDayToggle = shouldShowDisplayAllDayToggle(layoutView);
  // timeline: filter above sort; list: sort above filter
  const filterBeforeSort = shouldFilterBeforeSort(layoutView);

  // tertiary sublabel on the right — matches FormDetailSection date/time picker rows
  const sortValueTextStyle = useMemo(
    () => ({
      color: themeColors.text.tertiary(),
    }),
    [themeColors]
  );

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: 24,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: DISPLAY_GROUPED_LIST_ICON_COLUMN_WIDTH,
      contentPaddingVertical: DISPLAY_GROUPED_LIST_CONTENT_PADDING_VERTICAL,
      containerStyle: styles.listContainer,
    }),
    [styles.listContainer, themeColors]
  );

  const handleResetAll = useCallback(() => {
    Alert.alert(
      'Reset all display settings?',
      'Layout, sort, and filter preferences will return to their defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset all',
          style: 'destructive',
          onPress: resetAll,
        },
      ]
    );
  }, [resetAll]);

  const headerHeight = useHeaderHeight();
  const headerTitleStyle = useMemo(
    () => ({
      ...typography.getTextStyle('heading-4'),
      color: themeColors.text.primary(),
    }),
    [typography, themeColors]
  );
  const topSectionHeight =
    Platform.OS === 'ios' ? headerHeight + FADE_OVERFLOW : TOP_SECTION_HEIGHT;
  const scrollTopPadding =
    Platform.OS === 'ios' ? headerHeight + 24 : HEADER_TOP + HEADER_ROW_HEIGHT + 24;

  const handleSave = useCallback(() => {
    if (!hasChanges || isSaving) return;
    void (async () => {
      try {
        await dispatch(
          patchUserDisplayPreferences({
            context,
            patch: draftToDisplayPreferencesPatch(context, draft),
          })
        ).unwrap();
        router.back();
      } catch (e) {
        const msg = typeof e === 'string' ? e : 'Could not save display settings.';
        Alert.alert('Save failed', msg);
      }
    })();
  }, [hasChanges, isSaving, dispatch, context, draft, router]);

  // push onto the nested display stack (same slide transition as browse → inbox)
  const handleOpenPicker = useCallback(
    (row: DisplaySettingsPickerRow) => {
      const route = DISPLAY_SETTINGS_ROW_TO_ROUTE[row];
      router.push(`/(tabs)/${context}/display/${route}` as any);
    },
    [context, router]
  );

  const renderGroupedListIcon = useCallback(
    (name: string, fallback: React.ReactNode) => (
      <SFSymbolIcon
        name={name}
        size={DISPLAY_GROUPED_LIST_ICON_SIZE}
        color={groupedListIconColor}
        fallback={fallback}
      />
    ),
    [groupedListIconColor]
  );

  const sortSectionContent = (
    <>
      <GroupedListHeader title="Sort" style={styles.sectionHeader} />
      <View style={styles.groupedListSection}>
        <GroupedList {...listGroupProps}>
          <FormDetailButton
            key="sort-by-sort"
            iconComponent={renderGroupedListIcon(
              'arrow.up.arrow.down',
              <Ionicons
                name="swap-vertical"
                size={DISPLAY_GROUPED_LIST_ICON_SIZE}
                color={groupedListIconColor}
              />
            )}
            label="Sorting"
            value={sortOption}
            onPress={() => handleOpenPicker('sorting')}
            showChevron
            customStyles={{ value: sortValueTextStyle }}
          />
          <FormDetailButton
            key="sort-ordering"
            iconComponent={renderGroupedListIcon(
              'arrow.up.and.down.circle',
              <Ionicons
                name="reorder-three"
                size={DISPLAY_GROUPED_LIST_ICON_SIZE}
                color={groupedListIconColor}
              />
            )}
            label="Ordering"
            value={orderingOption}
            onPress={() => handleOpenPicker('ordering')}
            showChevron
            customStyles={{ value: sortValueTextStyle }}
          />
        </GroupedList>
      </View>
    </>
  );

  const sortSection = showSortSection ? (
    <DisplaySettingsAnimatedSection key="display-sort-section">{sortSectionContent}</DisplaySettingsAnimatedSection>
  ) : null;

  const filterSection = (
    <DisplaySettingsAnimatedSection key="display-filter-section">
      <GroupedListHeader title="Filter" style={styles.sectionHeader} />
      <View style={styles.groupedListSection}>
        <GroupedList {...listGroupProps}>
          {/* date filter hidden on today + planner — row not shown until list wiring exists */}
          <FormDetailButton
            key="filter-by-priority"
            iconComponent={renderGroupedListIcon(
              'flag.fill',
              <Ionicons
                name="flag"
                size={DISPLAY_GROUPED_LIST_ICON_SIZE}
                color={groupedListIconColor}
              />
            )}
            label="Priority"
            value={prioritySortSublabel}
            onPress={() => handleOpenPicker('priority')}
            showChevron
            customStyles={{ value: sortValueTextStyle }}
          />
        </GroupedList>
      </View>
    </DisplaySettingsAnimatedSection>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerTitle: 'Display',
            headerTitleStyle,
            headerLargeTitle: false,
          }}
        />
      ) : null}
      {isFocused ? <IosBrowseModalCloseStackToolbar /> : null}
      {isFocused && hasChanges && !isSaving ? (
        <IosBrowseModalTrailingStackToolbar
          icon="checkmark"
          onPress={handleSave}
          brandActive
          accessibilityLabel="Save display settings"
        />
      ) : null}
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: scrollTopPadding, paddingBottom: 120 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={styles.contentWrapper}>
            <GroupedListHeader title="Layout" />
            <View style={styles.layoutViewSelectorSection}>
              <DisplayLayoutViewSelector />
            </View>
            <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={styles.groupedListSection}>
              <GroupedList {...listGroupProps}>
                <View style={styles.completedTasksRow}>
                  <View style={styles.groupedListIconWrap}>
                    {renderGroupedListIcon(
                      'checkmark.circle.fill',
                      <TickIcon size={DISPLAY_GROUPED_LIST_ICON_SIZE} color={groupedListIconColor} />
                    )}
                  </View>
                  <Text
                    style={[styles.completedTasksLabel, { color: themeColors.text.primary() }]}
                    numberOfLines={1}
                  >
                    Completed tasks
                  </Text>
                  <Switch
                    value={showCompletedTasks}
                    onValueChange={setShowCompletedTasks}
                    accessibilityLabel="Show completed tasks"
                    trackColor={{
                      false: themeColors.interactive.tertiary(),
                      // on track uses marple brand — same accent as grouped list icons
                      true: groupedListIconColor,
                    }}
                    thumbColor={themeColors.background.elevated()}
                    ios_backgroundColor={themeColors.interactive.tertiary()}
                  />
                </View>
                {showAllDayToggle ? (
                  <DisplaySettingsAnimatedSection key="display-all-day-toggle">
                    <View style={styles.completedTasksRow}>
                      <View style={styles.groupedListIconWrap}>
                        {renderGroupedListIcon(
                          'sun.max.fill',
                          <Ionicons name="sunny" size={DISPLAY_GROUPED_LIST_ICON_SIZE} color={groupedListIconColor} />
                        )}
                      </View>
                      <Text
                        style={[styles.completedTasksLabel, { color: themeColors.text.primary() }]}
                        numberOfLines={1}
                      >
                        All-day tasks
                      </Text>
                      <Switch
                        value={showAllDayTasks}
                        onValueChange={setShowAllDayTasks}
                        accessibilityLabel="Show all-day tasks"
                        trackColor={{
                          false: themeColors.interactive.tertiary(),
                          true: groupedListIconColor,
                        }}
                        thumbColor={themeColors.background.elevated()}
                        ios_backgroundColor={themeColors.interactive.tertiary()}
                      />
                    </View>
                  </DisplaySettingsAnimatedSection>
                ) : null}
              </GroupedList>
            </Animated.View>

            {filterBeforeSort ? filterSection : sortSection}
            {filterBeforeSort ? sortSection : filterSection}

            <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={styles.resetSectionWrap}>
              <View style={[styles.groupedListSection, styles.resetGroupedListSection]}>
                <GroupedList {...listGroupProps} separatorConsiderIconColumn={false}>
                  <FormDetailButton
                    key="reset-all"
                    label="Reset all"
                    onPress={handleResetAll}
                    showChevron={false}
                    labelAlign="center"
                    customStyles={{ label: { color: resetLabelColor } }}
                  />
                </GroupedList>
              </View>
            </Animated.View>

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </ScrollView>
      </View>

      <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
        <View style={[styles.topSectionAnchor, { height: topSectionHeight }]} pointerEvents="box-none">
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[
              themeColors.background.primary(),
              themeColors.withOpacity(themeColors.background.primary(), 0),
            ]}
            locations={[0.4, 0.8]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        {Platform.OS === 'android' && isFocused ? (
          <>
            <View style={[styles.headerRow, { top: HEADER_TOP }]} pointerEvents="box-none">
              <View style={styles.headerPlaceholder} pointerEvents="none" />
              <View style={styles.headerCenter} pointerEvents="none">
                <Text style={headerTitleStyle}>Display</Text>
              </View>
              <View style={styles.headerPlaceholder} pointerEvents="none" />
            </View>
            <View style={styles.headerActionsContainer} pointerEvents="box-none">
              <MainCloseButton onPress={() => router.back()} top={Paddings.screen} left={Paddings.screen} />
              {hasChanges && !isSaving ? (
                <View
                  style={styles.androidApplyButtonAnchor}
                  pointerEvents="box-none"
                >
                  <MainSubmitButton
                    layout="inline"
                    onPress={handleSave}
                    brandActive
                    animateVisibility={false}
                    accessibilityLabel="Save display settings"
                  />
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (typography: ReturnType<typeof useTypography>) =>  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentArea: {
      flex: 1,
      zIndex: 0,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
      flexGrow: 1,
    },
    contentWrapper: {
      paddingHorizontal: 0,
    },
    groupedListSection: {
      paddingTop: 0,
    },
    // list/timeline picker sits between Layout header and the toggles grouped list
    layoutViewSelectorSection: {
      paddingTop: Paddings.groupedListHeaderContentGap,
      paddingBottom: Paddings.displayLayoutSelectorToGroupedListGap,
    },
    sectionHeader: {
      marginTop: 24,
    },
    listContainer: {
      marginVertical: 0,
    },
    completedTasksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      flex: 1,
    },
    // same icon gutter as FormDetailButton (margin only — no fixed column width)
    groupedListIconWrap: {
      marginRight: Paddings.groupedListIconTextSpacing,
    },
    completedTasksLabel: {
      ...getTextStyle('body-large'),
      flex: 1,
      minWidth: 0,
    },
    resetGroupedListSection: {
      // same vertical gap as stacked GroupedLists in list-create (above standalone reset card)
      marginTop: Paddings.section,
    },
    resetSectionWrap: {
      width: '100%',
    },
    bottomSpacer: {
      height: 120,
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
    headerActionsContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: TOP_SECTION_HEIGHT,
      zIndex: 11,
      overflow: 'visible',
    },
    // top-right anchor for inline apply — avoids full-screen touch wrapper swallowing taps
    androidApplyButtonAnchor: {
      position: 'absolute',
      top: Paddings.screen,
      right: Paddings.screen,
    },
  });
