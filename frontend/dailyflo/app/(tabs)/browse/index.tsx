import React, { useCallback, useMemo, useState } from 'react';

import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect } from 'expo-router';

import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

import { BlurView } from 'expo-blur';

import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import { useThemeColors } from '@/hooks/useColorPalette';

import { useTypography } from '@/hooks/useTypography';

import { useLists, useGamification, useTasks } from '@/store/hooks';

import { fetchTasks } from '@/store/slices/tasks/tasksSlice';

import { useAppDispatch } from '@/store/index';

import { BrowseProgressCard, computeTodayTaskGoal, localTodayDateStr } from '@/components/features/gamification';

import { useTabFabOverlay } from '@/contexts/TabFabOverlayContext';

import { USE_CUSTOM_LIQUID_TAB_BAR, fabChromeZoneStyle } from '@/components/navigation/tabBarChrome';

import { IosBrowseHomeStackToolbar } from '@/components/navigation/IosBrowseHomeStackToolbar';

import { ScreenHeaderActions } from '@/components/ui';

import { FloatingActionButton } from '@/components/ui/Button';

import { GroupedListHeader } from '@/components/ui/List/GroupedList';

import { SFSymbolIcon, BrowseIcon, LeafIcon, PencilIcon } from '@/components/ui/Icon';

import { Paddings } from '@/constants/Paddings';
import { FontWeight } from '@/constants/Typography';

import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';

const TOP_SECTION_ROW_HEIGHT = 48;

const TOP_SECTION_ANCHOR_HEIGHT = 64;



function BrowseListsColumn({

  styles,

  themeColors,

  router,

  sortedLists,

  isMyListsExpanded,

  setIsMyListsExpanded,

  summary,

  isSummaryLoading,

  todayTaskGoal,

}: {

  styles: ReturnType<typeof createStyles>;

  themeColors: ReturnType<typeof useThemeColors>;

  router: ReturnType<typeof useGuardedRouter>;

  sortedLists: { id: string; name: string; metadata?: { taskCount?: number }; sortOrder: number }[];

  isMyListsExpanded: boolean;

  setIsMyListsExpanded: React.Dispatch<React.SetStateAction<boolean>>;

  summary: ReturnType<typeof useGamification>['summary'];

  isSummaryLoading: boolean;

  todayTaskGoal: number;

}) {

  return (

    <View style={styles.contentWrapper}>

      <BrowseProgressCard

        summary={summary}

        isLoading={isSummaryLoading}

        todayTaskGoal={todayTaskGoal}

        onProductivityPress={() => router.push('/(tabs)/browse/productivity' as any)}

      />



      <GroupedListHeader

        title="My Lists"

        showDropdownArrow

        isExpanded={isMyListsExpanded}

        onPress={() => setIsMyListsExpanded((prev) => !prev)}

        style={styles.sectionHeader}

      />



      {isMyListsExpanded ? (

        <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)} style={styles.listsPillsContainer}>

          <TouchableOpacity

            style={[styles.listPill, { backgroundColor: themeColors.background.primarySecondaryBlend() }]}

            onPress={() => router.push('/(tabs)/browse/manage-lists')}

            activeOpacity={0.7}

          >

            <PencilIcon size={20} color={themeColors.text.primary()} />

            <Text style={[styles.listPillName, styles.listPillNameBold, { color: themeColors.text.primary() }]} numberOfLines={1}>

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

              <Text style={[styles.listPillCount, { color: themeColors.text.secondary() }]}>{list.metadata?.taskCount ?? 0}</Text>

            </TouchableOpacity>

          ))}

        </Animated.View>

      ) : null}

    </View>

  );

}



export default function BrowseScreen() {

  const router = useGuardedRouter();

  const dispatch = useAppDispatch();

  const themeColors = useThemeColors();

  const typography = useTypography();

  const insets = useSafeAreaInsets();

  const styles = createStyles(themeColors, typography, insets);

  const { lists, fetchLists } = useLists();

  const { tasks } = useTasks();

  const { summary, isSummaryLoading, fetchSummary } = useGamification();

  const [isMyListsExpanded, setIsMyListsExpanded] = useState(true);

  const { setTabFabRegistration } = useTabFabOverlay();



  const todayDateStr = useMemo(() => localTodayDateStr(), []);



  const todayTaskGoal = useMemo(
    () => computeTodayTaskGoal(tasks, summary?.completionsToday ?? 0, todayDateStr),
    [tasks, summary?.completionsToday, todayDateStr]
  );



  const openAchievements = useCallback(() => {

    router.push('/(tabs)/browse/achievements' as any);

  }, [router]);



  useFocusEffect(

    useCallback(() => {

      void fetchLists();

      void fetchSummary();

      void dispatch(fetchTasks());

    }, [fetchLists, fetchSummary, dispatch])

  );



  useFocusEffect(

    useCallback(() => {

      if (!USE_CUSTOM_LIQUID_TAB_BAR) return undefined;

      setTabFabRegistration({

        onPress: () =>

          router.push({

            pathname: '/(tabs)/browse/list-create' as any,

            params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },

          }),

        accessibilityLabel: 'Create new list',

        accessibilityHint: 'Opens the new list screen',

      });

      return () => setTabFabRegistration(null);

    }, [router, setTabFabRegistration])

  );



  const sortedLists = useMemo(() => [...lists].sort((a, b) => a.sortOrder - b.sortOrder), [lists]);



  return (

    <>

      <IosBrowseHomeStackToolbar onAchievementsPress={openAchievements} />

      <View style={styles.container}>

        <View pointerEvents="box-none" style={styles.topSectionAnchor}>

          <BlurView tint={themeColors.isDark ? 'dark' : 'light'} intensity={1} style={StyleSheet.absoluteFill} pointerEvents="none" />

          <LinearGradient

            colors={[themeColors.background.root(), themeColors.withOpacity(themeColors.background.root(), 0)]}

            locations={[0.4, 1]}

            style={StyleSheet.absoluteFill}

            pointerEvents="none"

          />

          {Platform.OS === 'android' ? (

            <View style={styles.topSectionRow} pointerEvents="box-none">

              <Pressable style={styles.searchPressable} onPress={() => router.push('/(tabs)/browse/search' as any)}>

                <SFSymbolIcon name="magnifyingglass" size={18} color={themeColors.text.primary()} fallback={<BrowseIcon size={16} color={themeColors.text.primary()} />} />

              </Pressable>

              <ScreenHeaderActions

                variant="browse"

                onSettingsPress={() => router.push('/(tabs)/browse/settings')}

                onAchievementsPress={openAchievements}

                style={styles.topSectionContextButton}

                tint="primary"

              />

            </View>

          ) : null}

        </View>



        <ScrollView

          style={styles.mainScroll}

          contentContainerStyle={styles.scrollContentContainer}

          showsVerticalScrollIndicator={false}

          keyboardShouldPersistTaps="handled"

          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}

        >

          <BrowseListsColumn

            styles={styles}

            themeColors={themeColors}

            router={router}

            sortedLists={sortedLists}

            isMyListsExpanded={isMyListsExpanded}

            setIsMyListsExpanded={setIsMyListsExpanded}

            summary={summary}

            isSummaryLoading={isSummaryLoading}

            todayTaskGoal={todayTaskGoal}

          />

        </ScrollView>



        {!USE_CUSTOM_LIQUID_TAB_BAR ? (

          <View style={[fabChromeZoneStyle, { zIndex: 20 }]}>

            <FloatingActionButton

              onPress={() =>

                router.push({

                  pathname: '/(tabs)/browse/list-create' as any,

                  params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },

                })

              }

              accessibilityLabel="Create new list"

              accessibilityHint="Opens the new list screen"

            />

          </View>

        ) : null}

      </View>

    </>

  );

}



const createStyles = (

  themeColors: ReturnType<typeof useThemeColors>,

  typography: ReturnType<typeof useTypography>,

  insets: ReturnType<typeof useSafeAreaInsets>

) =>

  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor: themeColors.background.root(),

    },

    topSectionAnchor: {

      position: 'absolute',

      top: 0,

      left: 0,

      right: 0,

      zIndex: 10,

      overflow: 'hidden',

      height: insets.top + TOP_SECTION_ANCHOR_HEIGHT,

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

    searchPressable: {

      width: 44,

      height: 44,

      borderRadius: 22,

      alignItems: 'center',

      justifyContent: 'center',

      backgroundColor: themeColors.background.primarySecondaryBlend(),

    },

    topSectionContextButton: {

      marginLeft: 'auto',

      alignSelf: 'center',

      backgroundColor: 'transparent',

    },

    mainScroll: {

      flex: 1,

    },

    scrollContentContainer: {

      flexGrow: 0,

      paddingBottom: Paddings.scrollBottomExtra + Paddings.contentVertical,

    },

    contentWrapper: {

      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT + Paddings.listItemVertical,

      paddingHorizontal: Paddings.screen,

      overflow: 'visible',

    },

    sectionHeader: {

      marginTop: Paddings.listItemVertical * 2,

    },

    listsPillsContainer: {

      flexDirection: 'row',

      flexWrap: 'wrap',

      gap: Paddings.formDataPillRowGap,

      paddingTop: Paddings.groupedListHeaderContentGap,

    },

    listPill: {

      flexDirection: 'row',

      alignItems: 'center',

      alignSelf: 'flex-start',

      paddingHorizontal: Paddings.formDataPillHorizontal,

      paddingVertical: Paddings.formDataPillVertical,

      borderRadius: Paddings.formDataPillRadius,

      minHeight: 44,

    },

    listPillName: {

      ...typography.getTextStyle('body-large'),

      marginLeft: Paddings.formDataPillIconGap,

    },

    listPillNameBold: {

      fontWeight: FontWeight.bold,

    },

    listPillCountGap: {

      width: Paddings.formDataPillIconGap,

    },

    listPillCount: {

      ...typography.getTextStyle('body-large'),

    },

  });

