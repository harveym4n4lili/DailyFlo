/**
 * Browse Screen
 *
 * Search mode: `searchOpen` / `isBrowseSearchMode` — user tapped the search row; floating field docks, top chrome hides.
 * Search results/placeholder live in an **overlay** `ScrollView`; browse lists stay in a **persistent** `ScrollView` (never unmounted for search) so cold-load and post-search top spacing match — only opacity/pointerEvents toggle.
 * Idle “Tasks/Lists” is **position: absolute** at `idleSearchBarTop` so its Y matches `measuredRowTop` used in `floatingSearchBlockStyle` / lift — no measureInWindow drift.
 * On close tap, `exitingBrowseSearch` is set so lists/FAB and filter chips hide immediately while `searchOpen` stays true until the bar/chrome finish sliding down.
 * `browseModesLayout` — animated wrapper: translates scroll content by the same delta as the floating search bar (row → docked) so the body moves with the bar.
 * Filter chips render only when `isBrowseSearchMode`; they sit in the same absolutely positioned block as the bar so they stay directly under it while animating.
 * That block includes a `searchModeTopFade` layer (BlurView + LinearGradient) matching the main browse top chrome so scroll content fades underneath.
 * While search is open, `searchModeTopInsetFill` stays solid above the scroll through the exit animation; `searchModeTopFade` unmounts on close tap so blur/gradient don’t linger.
 * The floating pill width tracks `focusProgress`: clipped row starts full-width with cancel off-screen; narrowing reveals the cancel sliding in (reverse when exiting).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  TextInput,
  Keyboard,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type TextStyle,
} from 'react-native';
import { useRouter, useFocusEffect, type Router } from 'expo-router';
import Animated, {
  FadeInUp,
  FadeOutUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import GlassView from 'expo-glass-effect/build/GlassView';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeaderActions } from '@/components/ui';
import { FloatingActionButton, MainCloseButton } from '@/components/ui/button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon, TickIcon, BrowseIcon, LeafIcon, PencilIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';
import { useLists } from '@/store/hooks';

const TOP_SECTION_ROW_HEIGHT = 48;
const FOCUS_ANIM_MS = 320;
// gap between search pill and cancel; included in FLOATING_ROW_CANCEL_RESERVE so width + translateX animations stay aligned
const SEARCH_TO_CANCEL_GAP = 16;
// matches MainCloseButton `inline`: 42 circle on iOS glass; wider text cancel on android/web fallback
const INLINE_CANCEL_TOUCH_SIZE = Platform.OS === 'ios' ? 42 : 76;
// horizontal space the cancel column needs when visible (gap + button width)
const FLOATING_ROW_CANCEL_RESERVE = SEARCH_TO_CANCEL_GAP + INLINE_CANCEL_TOUCH_SIZE;
// extra width on the floating block so the cancel’s glass/shadow isn’t clipped by the absolute layer
const FLOATING_SEARCH_BLOCK_WIDTH_BLEED = 8;
// height of the docked search row (matches searchTabInner minHeight) — used to stack filter chips below the bar
const FLOATING_SEARCH_BAR_ROW_HEIGHT = 44;
// non-search: gradient/blur band continues this far *below* the idle floating search bar into the list area (larger = longer fade)
const BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL = TOP_SECTION_ROW_HEIGHT + (FLOATING_SEARCH_BAR_ROW_HEIGHT / 2);
// vertical space between docked search row and chip strip (also folded into fade height + scroll placeholder inset)
const SEARCH_BAR_TO_CHIPS_GAP = 16;
// keep in sync with styles.searchFilterChipInner + styles.searchFilterChipsContent (chip vertical padding + minHeight + row paddingBottom)
const SEARCH_FILTER_CHIP_PADDING_V = 8;
const SEARCH_FILTER_CHIP_MIN_HEIGHT = 36;
const SEARCH_FILTER_CHIPS_CONTENT_PADDING_BOTTOM = 10;
const SEARCH_CHIP_ROW_HEIGHT =
  SEARCH_FILTER_CHIP_PADDING_V * 2 +
  SEARCH_FILTER_CHIP_MIN_HEIGHT +
  SEARCH_FILTER_CHIPS_CONTENT_PADDING_BOTTOM;
// floating row uses minHeight 44; searchTabInner paddingVertical (pillVertical) sits *inside* that box — no extra add here
// scroll placeholder starts below full bar + gap + chip scroller (includes chip paddings + content paddingBottom)
const SEARCH_OVERLAY_TOP_CLEARANCE =
  FLOATING_SEARCH_BAR_ROW_HEIGHT + SEARCH_BAR_TO_CHIPS_GAP + SEARCH_CHIP_ROW_HEIGHT;
// blur strip behind bar + gap + chips + small bleed below chips for liquid-glass halo
const SEARCH_MODE_TOP_FADE_BLEED_BELOW_CHIPS = 28;
const SEARCH_MODE_TOP_FADE_HEIGHT =
  FLOATING_SEARCH_BAR_ROW_HEIGHT +
  SEARCH_BAR_TO_CHIPS_GAP +
  SEARCH_CHIP_ROW_HEIGHT +
  SEARCH_MODE_TOP_FADE_BLEED_BELOW_CHIPS;

// ios default is "automatic": system adds safe-area to scroll content insets ON TOP of our paddingTop (insets.top + …) — cold start looks like huge pill→list gap; remount after search often "fixes" because insets settle. we handle safe area only in layout math.
const iosScrollNoAutomaticSafeAreaInsets =
  Platform.OS === 'ios' ? ({ contentInsetAdjustmentBehavior: 'never' as const } as const) : {};

// filter chips: order is fixed; ids are for toggles until search api exists
const DEFAULT_SEARCH_FILTER_CHIP_ID = 'recent';
const SEARCH_FILTER_CHIPS: { id: string; label: string }[] = [
  { id: 'recent', label: 'Recent' },
  { id: 'top', label: 'Top' },
  { id: 'task', label: 'Task' },
  { id: 'description', label: 'Description' },
  { id: 'lists', label: 'Lists' },
];

const CHIP_COLOR_ANIM_MS = 260;

type BrowseSearchFilterChipStyles = {
  searchFilterChipGlass: object;
  searchFilterChipInner: object;
  searchFilterChipAndroid: object;
  searchFilterChipLabel: TextStyle;
};

// shared-value progress drives interpolateColor only — font size/weight stay fixed so chip width doesn’t shift neighbors in the row
function BrowseSearchFilterChip({
  chip,
  selected,
  onToggle,
  themeColors,
  styles,
}: {
  chip: { id: string; label: string };
  selected: boolean;
  onToggle: (id: string) => void;
  themeColors: ReturnType<typeof useThemeColors>;
  styles: BrowseSearchFilterChipStyles;
}) {
  const progress = useSharedValue(selected ? 1 : 0);
  const primaryTint = themeColors.background.primary();
  const selectedTint = themeColors.interactive.primary();
  const primaryText = themeColors.text.primary();
  const invertedText = themeColors.text.invertedPrimary();
  const pillIdle = themeColors.background.primarySecondaryBlend();
  const pillSelected = themeColors.interactive.primary();

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: CHIP_COLOR_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, progress]);

  const tintWashStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', selectedTint]),
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [primaryText, invertedText]),
  }));

  const androidPillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [pillIdle, pillSelected]),
  }));

  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityState: { selected },
    accessibilityLabel: `${chip.label} filter`,
    accessibilityHint: selected
      ? 'Selected — double tap a different chip to change the filter'
      : 'Double tap to select this filter',
  };

  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={styles.searchFilterChipGlass}
        glassEffectStyle="clear"
        tintColor={primaryTint as any}
        isInteractive
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }, tintWashStyle]}
        />
        <Pressable onPress={() => onToggle(chip.id)} style={styles.searchFilterChipInner} {...a11y}>
          <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
        </Pressable>
      </GlassView>
    );
  }

  return (
    <Pressable
      onPress={() => onToggle(chip.id)}
      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      {...a11y}
    >
      <Animated.View style={[styles.searchFilterChipAndroid, androidPillStyle]}>
        <Animated.Text style={[styles.searchFilterChipLabel, labelAnimStyle]}>{chip.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// shared list column so browse scroll can wrap it in Animated (exit lift only) or plain View (idle — no hidden translateY)
function BrowseListsColumn({
  browseListsPaddingTop,
  styles,
  themeColors,
  router,
  sortedLists,
  isMyListsExpanded,
  setIsMyListsExpanded,
}: {
  browseListsPaddingTop: number;
  styles: ReturnType<typeof createStyles>;
  themeColors: ReturnType<typeof useThemeColors>;
  router: Router;
  sortedLists: { id: string; name: string; metadata?: { taskCount?: number }; sortOrder: number }[];
  isMyListsExpanded: boolean;
  setIsMyListsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <View style={[styles.browseListsContentWrapper, { paddingTop: browseListsPaddingTop }]}>
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

      <GroupedListHeader
        title="My Lists"
        showDropdownArrow
        isExpanded={isMyListsExpanded}
        onPress={() => setIsMyListsExpanded((prev) => !prev)}
        style={styles.myListsHeader}
      />

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
          {sortedLists.map((list) => (
            <TouchableOpacity
              key={list.id}
              style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}
              onPress={() => router.push(`/(tabs)/browse/list/${list.id}` as any)}
              activeOpacity={0.7}
            >
              <LeafIcon size={20} color={themeColors.text.tertiary()} />
              <Text style={[styles.listPillName, { color: themeColors.text.primary() }]} numberOfLines={1}>
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
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const styles = createStyles(themeColors, typography, insets);
  const { lists, fetchLists } = useLists();

  const rootRef = useRef<View>(null);
  const floatingInputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  // searchOpen: floating docked field + hidden idle row (true until close animation finishes)
  const [searchOpen, setSearchOpen] = useState(false);
  // exitingBrowseSearch: user tapped cancel/close — show browse lists/fab immediately while bar still slides
  const [exitingBrowseSearch, setExitingBrowseSearch] = useState(false);
  const isBrowseSearchMode = searchOpen;
  const showBrowseBodyContent = !searchOpen || exitingBrowseSearch;
  const searchOpenRef = useRef(false);
  const closeAnimatingRef = useRef(false);

  useEffect(() => {
    searchOpenRef.current = searchOpen;
  }, [searchOpen]);

  const dockedSearchTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;
  const horizontalPadding = Paddings.screen;
  const floatingRowWidth = windowWidth - horizontalPadding * 2;

  // fixed Y for idle pill + animation anchor (same as old scroll-row top): aligns with floating bar interpolate(measuredRowTop → dockedSearchTop)
  const idleSearchBarTop = insets.top + TOP_SECTION_ROW_HEIGHT + 12;
  // blur/gradient chrome covers settings row + gap + pill + tail so fade continues past the idle bar (non-search); search open uses same slide distance so the whole band clears
  const topChromeHeight =
    idleSearchBarTop + FLOATING_SEARCH_BAR_ROW_HEIGHT + BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL;
  const topChromeSlideDistance = topChromeHeight;
  // first list row starts below the absolute pill + same gap as former searchAnchor marginBottom
  const browseListsPaddingTop =
   FLOATING_SEARCH_BAR_ROW_HEIGHT + TOP_SECTION_ROW_HEIGHT + Paddings.screen + 12;

  const focusProgress = useSharedValue(0);
  const measuredRowTop = useSharedValue(idleSearchBarTop);

  // keep anchor in sync with safe-area when not in search mode so open/close math matches layout
  useEffect(() => {
    if (!searchOpen) {
      measuredRowTop.value = idleSearchBarTop;
    }
  }, [idleSearchBarTop, searchOpen, measuredRowTop]);

  useFocusEffect(
    useCallback(() => {
      void fetchLists();
    }, [fetchLists])
  );

  const sortedLists = useMemo(
    () => [...lists].sort((a, b) => a.sortOrder - b.sortOrder),
    [lists]
  );

  const [isMyListsExpanded, setIsMyListsExpanded] = useState(true);
  // exactly one chip is always selected; resets to Recent when search closes or opens
  const [activeSearchFilterId, setActiveSearchFilterId] = useState<string>(DEFAULT_SEARCH_FILTER_CHIP_ID);

  const toggleSearchFilterChip = useCallback((id: string) => {
    setActiveSearchFilterId((prev) => (prev === id ? prev : id));
  }, []);

  const openSearch = useCallback(() => {
    // absolute idle bar uses idleSearchBarTop — snapshot that value for the floating bar + scroll lift (same as pre-absolute measure path)
    measuredRowTop.value = idleSearchBarTop;
    setExitingBrowseSearch(false);
    setSearchOpen(true);
  }, [idleSearchBarTop, measuredRowTop]);

  const finishCloseSearch = useCallback(() => {
    closeAnimatingRef.current = false;
    setSearchOpen(false);
    setExitingBrowseSearch(false);
    setActiveSearchFilterId(DEFAULT_SEARCH_FILTER_CHIP_ID);
    // hard-zero so browse scroll never keeps a stale translateY after exit (fixes pill→Inbox gap vs cold start)
    focusProgress.value = 0;
  }, [focusProgress]);

  const closeSearch = useCallback(() => {
    if (!searchOpenRef.current || closeAnimatingRef.current) return;
    closeAnimatingRef.current = true;
    Keyboard.dismiss();
    // swap scroll body back to lists right away; keep searchOpen true so idle row stays hidden until bar finishes
    setExitingBrowseSearch(true);
    // do not update measuredRowTop here while focusProgress is still 1 — that changes `lift` in
    // browseModesLayoutStyle instantly and the bar/content jump instead of animating down.
    // exit uses the same measuredRowTop from open (idleSearchBarTop when bar is absolute).
    focusProgress.value = withTiming(
      0,
      { duration: FOCUS_ANIM_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(finishCloseSearch)();
      }
    );
  }, [finishCloseSearch, focusProgress]);

  useEffect(() => {
    if (!searchOpen) return;
    focusProgress.value = 0;
    focusProgress.value = withTiming(1, {
      duration: FOCUS_ANIM_MS,
      easing: Easing.out(Easing.cubic),
    });
    const t = requestAnimationFrame(() => {
      floatingInputRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [searchOpen, focusProgress]);

  // when browse is the only mode again, guarantee lift transform is cleared (covers edge cases where reanimated leaves epsilon or remount order differs from cold load)
  useEffect(() => {
    if (!searchOpen && !exitingBrowseSearch) {
      focusProgress.value = 0;
    }
  }, [searchOpen, exitingBrowseSearch, focusProgress]);

  const topChromeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          focusProgress.value,
          [0, 1],
          [0, -topChromeSlideDistance],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  // overflow visible so glass/hitSlop aren’t clipped; cancel translateX hides it at progress 0 (same distance as reserve) then slides in with the narrowing pill
  const floatingSearchRowLayoutStyle = useAnimatedStyle(() => ({
    width: floatingRowWidth + FLOATING_SEARCH_BLOCK_WIDTH_BLEED,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: FLOATING_SEARCH_BAR_ROW_HEIGHT,
    overflow: 'visible',
  }));

  const floatingCancelSlideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          focusProgress.value,
          [0, 1],
          [FLOATING_ROW_CANCEL_RESERVE, 0],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const floatingSearchPillWidthStyle = useAnimatedStyle(() => ({
    width: interpolate(
      focusProgress.value,
      [0, 1],
      [floatingRowWidth, floatingRowWidth - FLOATING_ROW_CANCEL_RESERVE],
      Extrapolation.CLAMP
    ),
    minWidth: 0,
  }));

  // whole block (search row + filter chips) moves with focusProgress so chips stay glued under the bar
  const floatingSearchBlockStyle = useAnimatedStyle(() => {
    const top = interpolate(
      focusProgress.value,
      [0, 1],
      [measuredRowTop.value, dockedSearchTop],
      Extrapolation.CLAMP
    );
    return {
      position: 'absolute' as const,
      top,
      left: horizontalPadding,
      width: floatingRowWidth + FLOATING_SEARCH_BLOCK_WIDTH_BLEED,
      overflow: 'visible',
      zIndex: 22,
    };
  });

  // lifts scroll content with the search bar: same distance the bar moves up (measured row y → docked y)
  const browseModesLayoutStyle = useAnimatedStyle(() => {
    const lift = measuredRowTop.value - dockedSearchTop;
    return {
      transform: [
        {
          translateY: interpolate(focusProgress.value, [0, 1], [0, -lift], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const searchField = (
    <>
      <SFSymbolIcon
        name="magnifyingglass"
        size={20}
        color={themeColors.text.primary()}
        fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
      />
      <TextInput
        ref={floatingInputRef}
        value={query}
        onChangeText={setQuery}
        placeholder="Tasks/Lists"
        // tertiary while actively searching; on close tap match idle row label (primary) before the bar finishes moving
        placeholderTextColor={
          exitingBrowseSearch ? themeColors.text.primary() : themeColors.text.tertiary()
        }
        style={[styles.searchInput, { color: themeColors.text.primary() }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
    </>
  );

  return (
    <View ref={rootRef} style={{ flex: 1 }}>
      <Animated.View
        style={[styles.topSectionAnchor, { height: topChromeHeight }, topChromeStyle]}
      >
        <BlurView
          tint={themeColors.isDark ? 'dark' : 'light'}
          intensity={1}
          style={StyleSheet.absoluteFill}
        />
        {/* three stops so fade reads through the pill row and keeps softening below it (top chrome height includes pill + BROWSE_IDLE_TOP_BLUR_TAIL_PAST_PILL) */}
        <LinearGradient
          colors={[
            themeColors.background.primary(),
            themeColors.withOpacity(themeColors.background.primary(), 0),
          ]}
          locations={[0.4,0.8]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.topSectionRow} pointerEvents="box-none">
          <View style={styles.topSectionPlaceholder} pointerEvents="none" />
          <ScreenHeaderActions
            variant="browse"
            onSettingsPress={() => router.push('/(tabs)/browse/settings')}
            style={styles.topSectionContextButton}
            tint="primary"
          />
        </View>
      </Animated.View>

      {/* browse scroll stays mounted (opacity off during full search) so ios/android don’t remeasure a new scroll view — fixes pill→list gap differing cold vs after search */}
      <View style={styles.browseScrollStack}>
        <ScrollView
          {...iosScrollNoAutomaticSafeAreaInsets}
          style={[styles.mainScroll, !showBrowseBodyContent && styles.browseScrollHidden]}
          pointerEvents={showBrowseBodyContent ? 'auto' : 'none'}
          contentContainerStyle={styles.scrollContentContainerBrowse}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {/* lift transform only while exit animation runs — idle browse uses a plain View so no hidden translateY vs cold load */}
          {exitingBrowseSearch ? (
            <Animated.View style={[styles.browseModesLayoutBrowse, browseModesLayoutStyle]}>
              <BrowseListsColumn
                browseListsPaddingTop={browseListsPaddingTop}
                styles={styles}
                themeColors={themeColors}
                router={router}
                sortedLists={sortedLists}
                isMyListsExpanded={isMyListsExpanded}
                setIsMyListsExpanded={setIsMyListsExpanded}
              />
            </Animated.View>
          ) : (
            <View style={styles.browseModesLayoutBrowse}>
              <BrowseListsColumn
                browseListsPaddingTop={browseListsPaddingTop}
                styles={styles}
                themeColors={themeColors}
                router={router}
                sortedLists={sortedLists}
                isMyListsExpanded={isMyListsExpanded}
                setIsMyListsExpanded={setIsMyListsExpanded}
              />
            </View>
          )}
        </ScrollView>

        {isBrowseSearchMode && !exitingBrowseSearch ? (
          <ScrollView
            {...iosScrollNoAutomaticSafeAreaInsets}
            style={[styles.mainScroll, styles.searchScrollOverlay]}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            <Animated.View style={[styles.browseModesLayout, browseModesLayoutStyle]}>
              <View style={styles.contentWrapper}>
                <View
                  style={[styles.browseSearchContent, styles.browseSearchContentBelowFloating]}
                  accessibilityRole="summary"
                  accessibilityLabel="Search: type to find tasks and lists. Filters and live results are not connected yet."
                >
                  {/* static copy until search hits the backend — explains what this area will do */}
                  <Text style={[styles.searchModeHeadline, { color: themeColors.text.primary() }]}>
                    Search tasks & lists
                  </Text>
                  <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                    Type in the field above to look across your tasks and list names. When search is wired to the
                    server, matches will appear here as you type, with the same look and feel as the rest of Browse.
                  </Text>
                  <Text style={[styles.searchModeBody, { color: themeColors.text.secondary() }]}>
                    Scroll the chip row horizontally for Recent, Top, Task, Description, and Lists — only one filter
                    stays selected at a time (tap again to clear); the API will use that choice for search results.
                  </Text>
                  <Text style={[styles.searchModeHint, { color: themeColors.text.tertiary() }]}>
                    Tip: tap Cancel or the close control to leave search and return to Inbox, Completed, Tags, and My
                    Lists.
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        ) : null}
      </View>

      {/* idle pill fixed in window space — measuredRowTop === idleSearchBarTop so floating bar anim matches without layout measure */}
      {showBrowseBodyContent ? (
        <View
          style={[styles.searchIdleAbsolute, { top: idleSearchBarTop }]}
          pointerEvents="box-none"
        >
          <View
            style={[styles.searchIdleWrap, isBrowseSearchMode && styles.searchIdleHidden]}
            pointerEvents={isBrowseSearchMode ? 'none' : 'auto'}
            accessibilityElementsHidden={isBrowseSearchMode}
            importantForAccessibility={isBrowseSearchMode ? 'no-hide-descendants' : 'auto'}
          >
            {Platform.OS === 'ios' ? (
              <GlassView
                style={styles.searchTab}
                glassEffectStyle="clear"
                tintColor={themeColors.background.primary() as any}
                isInteractive
              >
                <Pressable onPress={openSearch} style={styles.searchTabInner}>
                  <SFSymbolIcon
                    name="magnifyingglass"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                  />
                  <Text style={[styles.searchTabLabel, { color: themeColors.text.primary() }]}>Tasks/Lists</Text>
                </Pressable>
              </GlassView>
            ) : (
              <TouchableOpacity
                style={[styles.searchTab, styles.searchTabAndroid, { backgroundColor: themeColors.background.primary() }]}
                onPress={openSearch}
                activeOpacity={0.7}
              >
                <SFSymbolIcon
                  name="magnifyingglass"
                  size={20}
                  color={themeColors.text.primary()}
                  fallback={<BrowseIcon size={18} color={themeColors.text.primary()} />}
                />
                <Text style={[styles.searchTabLabel, { color: themeColors.text.primary() }]}>Tasks/Lists</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : null}

      {/* solid header band while search chrome is slid away — stays through exit anim so scroll doesn’t bleed into insets */}
      {isBrowseSearchMode ? <View style={styles.searchModeTopInsetFill} pointerEvents="none" /> : null}

      {isBrowseSearchMode ? (
        <Animated.View
          style={[floatingSearchBlockStyle, Platform.OS === 'android' && { elevation: 16 }]}
        >
          {/* unmount on close tap with chips so blur/gradient don’t linger while the bar animates down */}
          {!exitingBrowseSearch ? (
            <View style={styles.searchModeTopFade} pointerEvents="none">
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
          ) : null}
          <View style={styles.searchModeFloatingForeground} pointerEvents="box-none">
            <Animated.View style={floatingSearchRowLayoutStyle}>
              <Animated.View style={[floatingSearchPillWidthStyle, styles.floatingSearchPillSlot]}>
                {Platform.OS === 'ios' ? (
                  <GlassView
                    style={[styles.searchTabFloating, styles.floatingSearchPillFill]}
                    glassEffectStyle="clear"
                    tintColor={themeColors.background.primary() as any}
                    isInteractive
                  >
                    <View style={styles.searchTabInner}>{searchField}</View>
                  </GlassView>
                ) : (
                  <View
                    style={[
                      styles.searchTabFloating,
                      styles.searchTabAndroid,
                      styles.floatingSearchPillFill,
                      { backgroundColor: themeColors.background.primary() },
                    ]}
                  >
                    {searchField}
                  </View>
                )}
              </Animated.View>
              <Animated.View
                style={[
                  styles.floatingCancelSlot,
                  { marginLeft: SEARCH_TO_CANCEL_GAP },
                  floatingCancelSlideStyle,
                ]}
              >
                <MainCloseButton layout="inline" onPress={closeSearch} />
              </Animated.View>
            </Animated.View>
            {/* chips hide on the same tap as close (exitingBrowseSearch) so only the bar animates down */}
            {!exitingBrowseSearch ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                removeClippedSubviews={false}
                style={[
                  styles.searchFilterChipsScroll,
                  // full-bleed strip: cancel parent’s screen inset so the scroll view hits physical edges
                  { marginLeft: -horizontalPadding, width: windowWidth, overflow: 'visible' },
                ]}
                contentContainerStyle={styles.searchFilterChipsContent}
              >
                {SEARCH_FILTER_CHIPS.map((chip) => (
                  <BrowseSearchFilterChip
                    key={chip.id}
                    chip={chip}
                    selected={activeSearchFilterId === chip.id}
                    onToggle={toggleSearchFilterChip}
                    themeColors={themeColors}
                    styles={styles}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {showBrowseBodyContent ? (
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
      ) : null}
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
      justifyContent: 'flex-end',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
      marginRight: 'auto',
    },
    topSectionContextButton: {
      marginLeft: 'auto',
      alignSelf: 'center',
      backgroundColor: 'transparent',
    },
    browseScrollStack: {
      flex: 1,
      // default relative so searchScrollOverlay absolute fill is bounded to tab body
      position: 'relative',
    },
    mainScroll: {
      flex: 1,
      zIndex: 1,
    },
    // hides lists under search overlay without unmounting — keeps one native scroll metrics path for grouped lists
    browseScrollHidden: {
      opacity: 0,
    },
    // full-area search scroll above browse; only mounted while search is active (exit swaps back to browse-only chrome)
    searchScrollOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      zIndex: 3,
    },
    // absolute idle pill — same horizontal inset as scroll lists (contentWrapper)
    searchIdleAbsolute: {
      position: 'absolute',
      left: Paddings.screen,
      right: Paddings.screen,
      zIndex: 15,
    },
    searchModeTopInsetFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9,
      height: insets.top + TOP_SECTION_ROW_HEIGHT,
      backgroundColor: themeColors.background.primary(),
    },
    searchModeTopFade: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: SEARCH_MODE_TOP_FADE_HEIGHT,
      zIndex: 0,
      overflow: 'visible',
    },
    searchModeFloatingForeground: {
      zIndex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    // browse lists only: don’t grow content to fill viewport — avoids different vertical distribution after search scroll remount vs first load
    scrollContentContainerBrowse: {
      flexGrow: 0,
    },
    browseModesLayout: {
      flexGrow: 1,
      alignSelf: 'stretch',
    },
    browseModesLayoutBrowse: {
      alignSelf: 'stretch',
    },
    contentWrapper: {
      flex: 1,
      paddingTop: insets.top + TOP_SECTION_ROW_HEIGHT + 12, // DO NOT CHANGE THIS FOR NOW
      paddingBottom: 120,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
    },
    // browse lists only: paddingTop applied inline (below absolute search row); no flex:1 so scroll height follows content
    browseListsContentWrapper: {
      
      paddingBottom: 120,
      paddingHorizontal: Paddings.screen,
      backgroundColor: themeColors.background.primary(),
      overflow: 'visible',
    },
    searchIdleWrap: {
      alignSelf: 'stretch',
    },
    searchIdleHidden: {
      opacity: 0,
    },
    searchTab: {
      borderRadius: 20,
      overflow: 'visible',
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
    floatingSearchPillSlot: {
      minWidth: 0,
    },
    floatingSearchPillFill: {
      width: '100%',
    },
    floatingCancelSlot: {
      width: INLINE_CANCEL_TOUCH_SIZE,
      minWidth: INLINE_CANCEL_TOUCH_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
    },
    // horizontal-only chip strip; overflow visible + removeClippedSubviews false so liquid glass can extend past chip bounds
    searchFilterChipsScroll: {
      marginTop: SEARCH_BAR_TO_CHIPS_GAP,
      flexGrow: 0,
      overflow: 'visible',
    },
    searchFilterChipsContent: {
      flexDirection: 'row',
      flexWrap: 'nowrap',
      alignItems: 'center',
      gap: 16,
      paddingTop: 0,
      paddingBottom: 10,
      // inset lives on scroll content, not the scroll view — aligns first chip with search field above
      paddingLeft: Paddings.screen,
      paddingRight: Paddings.screen,
    },
    searchFilterChipGlass: {
      borderRadius: 20,
      overflow: 'visible',
    },
    searchFilterChipInner: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchFilterChipAndroid: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      borderRadius: 20,
      overflow: 'visible',
      justifyContent: 'center',
      alignItems: 'center',
    },
    // fixed metrics for all states so selected vs idle doesn’t resize the pill and nudge sibling chips
    searchFilterChipLabel: {
      ...typography.getTextStyle('body-medium'),
      fontWeight: '600',
    },
    searchTabFloating: {
      borderRadius: 20,
      overflow: 'visible',
    },
    searchInput: {
      ...typography.getTextStyle('body-large'),
      flex: 1,
      marginLeft: Paddings.groupedListIconTextSpacing,
      padding: 0,
      backgroundColor: 'transparent',
    },
    myListsHeader: {
      marginTop: 24,
    },
    browseSearchContent: {
      flexGrow: 1,
      minHeight: 120,
      paddingTop: Paddings.touchTargetSmall,
      // temporary: extra space so search placeholder scrolls on short screens; trim when real results list ships
      paddingBottom: 480,
    },
    browseSearchContentBelowFloating: {
      // keeps placeholder text below the absolute search bar + chip strip
      paddingTop: SEARCH_OVERLAY_TOP_CLEARANCE,
    },
    searchModeHeadline: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '600',
      marginBottom: 12,
    },
    searchModeBody: {
      ...typography.getTextStyle('body-medium'),
      marginBottom: 14,
      lineHeight: 22,
    },
    searchModeHint: {
      ...typography.getTextStyle('body-small'),
      marginTop: 8,
      lineHeight: 20,
    },
    groupedListSection: {
      paddingTop: 0,
    },
    listContainer: {
      marginVertical: 0,
    },
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
