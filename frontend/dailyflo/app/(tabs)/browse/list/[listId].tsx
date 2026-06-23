/**
 * single-list view on the browse stack — opened when a My Lists pill is pressed.
 * layout matches today list detail: tasks | habits pills, list/timeline display prefs, overflow toolbar.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton } from '@/components/ui/Button';
import { ScreenHeaderActions } from '@/components/ui';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import { IosDashboardOverflowToolbar } from '@/components/navigation/IosDashboardOverflowToolbar';
import { ListDetailScreenContent } from '@/components/features/lists/ListDetailScreenContent';
import { Paddings } from '@/constants/Paddings';
import { useUI, useLists } from '@/store/hooks';

const TOP_SECTION_ROW_HEIGHT = 48;
const TOP_SECTION_ANCHOR_HEIGHT = 64;
const SCROLL_THRESHOLD = 16;

export default function BrowseListDetailScreen() {
  const router = useGuardedRouter();
  const params = useLocalSearchParams<{ listId: string | string[] }>();
  const listId = Array.isArray(params.listId) ? params.listId[0] : params.listId;

  const themeColors = useThemeColors();
  const typography = useTypography();
  const insets = useSafeAreaInsets();
  const { selection } = useUI();
  const { lists, fetchLists } = useLists();

  const openDisplaySettings = useCallback(() => {
    router.push('/(tabs)/browse/display' as any);
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void fetchLists();
    }, [fetchLists]),
  );

  const list = useMemo(
    () => (listId ? lists.find((l) => l.id === listId) : undefined),
    [lists, listId],
  );
  const title = list?.name ?? 'List';

  const styles = useMemo(() => createStyles(typography, insets), [typography, insets]);

  const scrollY = useSharedValue(0);
  const miniHeaderOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (shouldShow) => {
      miniHeaderOpacity.value = withTiming(shouldShow ? 1 : 0, { duration: 200 });
    },
  );

  const miniHeaderStyle = useAnimatedStyle(() => ({
    opacity: miniHeaderOpacity.value,
  }));

  const backButtonTop = insets.top + (TOP_SECTION_ROW_HEIGHT - 42) / 2;

  const isSelectionMode = selection.isSelectionMode && selection.selectionType === 'tasks';
  const listSelectionMode = Platform.OS === 'android' && isSelectionMode;

  if (!listId) {
    return (
      <View style={{ flex: 1, padding: Paddings.screen }}>
        <Text style={{ color: themeColors.text.primary() }}>List not found.</Text>
      </View>
    );
  }

  return (
    <>
      {Platform.OS === 'ios' ? <IosBrowseBackStackToolbar /> : null}
      <IosDashboardOverflowToolbar hidden={listSelectionMode} />
      <View style={{ flex: 1 }}>
        <View style={[styles.topSectionAnchor, { height: insets.top + TOP_SECTION_ANCHOR_HEIGHT }]}>
          <BlurView
            tint={themeColors.isDark ? 'dark' : 'light'}
            intensity={1}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              themeColors.background.root(),
              themeColors.withOpacity(themeColors.background.root(), 0),
            ]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.topSectionRow} pointerEvents="box-none">
            <View style={styles.topSectionPlaceholder} pointerEvents="none" />
            <Animated.View style={[styles.miniHeader, miniHeaderStyle]} pointerEvents="none">
              <Text
                style={[styles.miniHeaderText, { color: themeColors.text.primary() }]}
                numberOfLines={1}
              >
                {listSelectionMode ? `${selection.selectedItems.length} selected` : title}
              </Text>
            </Animated.View>
            {Platform.OS === 'android' ? (
              <ScreenHeaderActions
                variant="dashboard"
                onDashboardPress={openDisplaySettings}
                style={styles.topSectionContextButton}
                tint="primary"
              />
            ) : null}
          </View>
        </View>

        {Platform.OS === 'android' ? (
          <View style={styles.backButtonContainer} pointerEvents="box-none">
            <MainBackButton onPress={() => router.back()} top={backButtonTop} left={Paddings.screen} />
          </View>
        ) : null}

        {list ? (
          <ListDetailScreenContent
            listId={listId}
            title={title}
            listSelectionMode={listSelectionMode}
            scrollYSharedValue={scrollY}
          />
        ) : (
          <View style={styles.missingListWrap}>
            <Text style={[styles.mutedLead, { color: themeColors.text.tertiary() }]}>
              This list could not be found. Go back and pick another list.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  insets: ReturnType<typeof useSafeAreaInsets>,
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
      left: 0,
      right: 0,
      bottom: 0,
      height: TOP_SECTION_ROW_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Paddings.screen,
    },
    topSectionPlaceholder: {
      width: 44,
      height: 44,
    },
    miniHeader: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },
    miniHeaderText: {
      ...typography.getTextStyle('heading-small'),
      textAlign: 'center',
    },
    topSectionContextButton: {
      marginLeft: 'auto',
    },
    backButtonContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 11,
    },
    missingListWrap: {
      flex: 1,
      paddingHorizontal: Paddings.screen,
      paddingTop: insets.top + TOP_SECTION_ANCHOR_HEIGHT + 16,
    },
    mutedLead: {
      ...typography.getTextStyle('body-medium'),
    },
  });
