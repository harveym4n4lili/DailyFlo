/**
 * Manage Lists – full-screen modal on the browse stack.
 * Card rows: tap row opens that list’s browse screen; long-press to reorder; trash deletes
 * (react-native-draggable-flatlist). ScaleDecorator slightly scales the row while it is being dragged.
 */

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton, MainCreateButton } from '@/components/ui/button';
import {
  IosBrowseModalCloseStackToolbar,
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';
import { Paddings } from '@/constants/Paddings';
import { getFontFamilyWithWeight } from '@/constants/Typography';
import { LeafIcon } from '@/components/ui/icon';
import { useLists } from '@/store/hooks';
import type { List } from '@/types';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

// match LogCard / activity row icon size
const ROW_ICON_SIZE = 20;
// drag handle column same width as icon so columns line up visually
const DRAG_HANDLE_COLUMN = ROW_ICON_SIZE;
// uniform scale while this row is the active drag target (library ties this to drag lifecycle)
const DRAG_ACTIVE_SCALE = 1.05;
// trash sits in a touchable column; keep row height comfortable
const DELETE_HIT_WIDTH = 44;
// grouped-list style chrome (matches browse settings / list-create GroupedList)
const LIST_CARD_RADIUS = 24;

export default function ManageListsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const semanticColors = useSemanticColors();
  const typography = useTypography();
  const styles = createStyles(typography);

  const {
    lists,
    isLoading,
    fetchLists,
    reorderLists,
    persistListOrder,
    deleteList,
  } = useLists();

  // when this screen opens, pull lists into redux (mock api today) so rows exist
  useFocusEffect(
    useCallback(() => {
      void fetchLists();
    }, [fetchLists])
  );

  // stable sort from redux (source of truth for fetch/delete)
  const orderedLists = useMemo(
    () => [...lists].sort((a, b) => a.sortOrder - b.sortOrder),
    [lists]
  );

  // local row order for DraggableFlatList: updating here inside onDragEnd keeps the list in sync
  // before redux re-renders. if we only passed redux data, the flatlist saw a second data change and
  // ran its internal reset() — that caused the one-frame “jump to top” flash after drop.
  const displayDataRef = useRef<List[]>([]);
  const [displayData, setDisplayData] = useState<List[]>([]);

  useLayoutEffect(() => {
    const sorted = [...lists].sort((a, b) => a.sortOrder - b.sortOrder);
    const nextSig = sorted.map((l) => l.id).join(',');
    const prevSig = displayDataRef.current.map((l) => l.id).join(',');
    if (nextSig === prevSig && sorted.length === displayDataRef.current.length) {
      return;
    }
    displayDataRef.current = sorted;
    setDisplayData(sorted);
  }, [lists]);

  const onDragEnd = useCallback(
    ({ data }: { data: List[] }) => {
      const ids = data.map((l) => l.id);
      displayDataRef.current = data;
      setDisplayData(data);
      reorderLists(ids);
      // PATCH sort_order on server (refetch on failure inside thunk)
      void persistListOrder(ids);
    },
    [reorderLists, persistListOrder]
  );

  const confirmDelete = useCallback(
    (list: List) => {
      if (list.isDefault) {
        Alert.alert('Cannot delete', 'The default list cannot be deleted.');
        return;
      }
      // copy matches backend: DELETE /lists/ soft-deletes list and sets those tasks' list to null (inbox)
      Alert.alert(
        'Delete list',
        `Remove “${list.name}”? Tasks in this list will move to your Inbox. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              void deleteList(list.id);
            },
          },
        ]
      );
    },
    [deleteList]
  );

  // replace this modal with list/[listId] so back from the list returns to browse (same as FAB → list-create)
  const openListDetail = useCallback(
    (listId: string) => {
      router.replace(`/(tabs)/browse/list/${listId}` as any);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<List>) => {
      const index = getIndex() ?? 0;
      const tertiary = themeColors.text.tertiary();
      const titleStyle = {
        ...typography.getTextStyle('heading-4'),
        fontFamily: getFontFamilyWithWeight('medium'),
        color: themeColors.text.primary(),
        flex: 1,
      };
      const cardBg = themeColors.background.primarySecondaryBlend();

      return (
        <View
          style={[
            styles.cardOuter,
            index < displayData.length - 1 ? styles.cardOuterGap : null,
          ]}
        >
          <ScaleDecorator activeScale={DRAG_ACTIVE_SCALE}>
            <View style={[styles.card, { backgroundColor: cardBg, borderRadius: LIST_CARD_RADIUS }]}>
              {/* row split: main area opens list / drag; trash is a sibling so its tap never triggers openListDetail (nested pressables often bubble to parent and replace() unmounted this screen before Alert showed) */}
              <View style={styles.row}>
                <Pressable
                  onPress={() => openListDetail(item.id)}
                  onLongPress={drag}
                  delayLongPress={220}
                  disabled={isActive}
                  style={({ pressed }) => [
                    styles.rowMain,
                    pressed && !isActive ? styles.rowPressed : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${item.name}`}
                >
                  <View style={styles.dragHandleColumn} pointerEvents="none">
                    <Ionicons name="reorder-three" size={22} color={tertiary} />
                  </View>
                  <View style={styles.listIconWrap}>
                    <LeafIcon size={ROW_ICON_SIZE} color={tertiary} />
                  </View>
                  <Text style={titleStyle} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(item)}
                  style={styles.deletePressable}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel={`Delete ${item.name}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={22} color={semanticColors.error()} />
                </Pressable>
              </View>
            </View>
          </ScaleDecorator>
        </View>
      );
    },
    [
      confirmDelete,
      displayData.length,
      openListDetail,
      semanticColors,
      themeColors,
      typography,
    ]
  );

  const keyExtractor = useCallback((item: List) => item.id, []);

  // ios: native nav bar holds Stack.Toolbar close + add; offset in-content chrome to sit below it.
  const headerHeight = useHeaderHeight();
  const iosNavOffset = Platform.OS === 'ios' ? headerHeight : 0;
  const topSectionHeight = iosNavOffset + TOP_SECTION_HEIGHT;
  const contentTopInset = iosNavOffset + HEADER_ROW_HEIGHT;
  const headerTitleStyle = {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
  };

  const listEmpty = !isLoading && orderedLists.length === 0;

  // replace modal so manage-lists dismisses and list-create opens in one navigation (same stack as FAB)
  const openListCreate = useCallback(() => {
    router.replace({
      pathname: '/(tabs)/browse/list-create' as any,
      params: { openedFrom: LIST_CREATE_OPENED_FROM_BROWSE },
    });
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      <IosBrowseModalCloseStackToolbar />
      <IosBrowseModalTrailingStackToolbar
        icon="plus"
        onPress={openListCreate}
        accessibilityLabel="Create new list"
      />
      <View style={styles.contentArea}>
        {isLoading && orderedLists.length === 0 ? (
          <View style={[styles.centered, { paddingTop: contentTopInset + 48 }]}>
            <ActivityIndicator color={themeColors.text.tertiary()} />
          </View>
        ) : listEmpty ? (
          <View style={[styles.emptyWrap, { paddingTop: contentTopInset + 40 }]}>
            <Text style={[styles.emptyText, { color: themeColors.text.secondary() }]}>
              No lists yet. Create one from the browse tab.
            </Text>
          </View>
        ) : (
          <DraggableFlatList
            data={displayData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onDragEnd={onDragEnd}
            dragItemOverflow
            extraData={displayData.length}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingTop: contentTopInset + 40,
                paddingBottom: 200 + insets.bottom,
              },
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* fixed header: blur + gradient + centered title + close (matches browse settings) */}
      <View
        collapsable={false}
        style={[styles.headerOverlay, { height: topSectionHeight }]}
        pointerEvents="box-none"
      >
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
            locations={[0.4, 0.8]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
        <View style={[styles.headerRow, { top: iosNavOffset + HEADER_TOP }]} pointerEvents="box-none">
          <View style={styles.headerPlaceholder} pointerEvents="none" />
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={headerTitleStyle}>Manage Lists</Text>
          </View>
          <View style={styles.headerPlaceholder} pointerEvents="none" />
        </View>
        {Platform.OS === 'android' ? (
          <View style={styles.headerActionsContainer} pointerEvents="box-none">
            <MainCloseButton
              onPress={() => router.back()}
              top={Paddings.screen}
              left={Paddings.screen}
            />
            <MainCreateButton
              onPress={openListCreate}
              top={Paddings.screen}
              right={Paddings.screen}
              accessibilityLabel="Create new list"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (typography: ReturnType<typeof useTypography>) =>
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
    listContent: {
      paddingHorizontal: Paddings.screen,
    },
    cardOuter: {
      width: '100%',
    },
    // vertical gap between cards — same token as list row rhythm (browse My Lists pills use gap: 12)
    cardOuterGap: {
      marginBottom: Paddings.listItemVertical,
    },
    card: {
      overflow: 'hidden',
      paddingHorizontal: Paddings.groupedListContentHorizontal,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Paddings.card,
      gap: Paddings.groupedListContentHorizontal,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Paddings.groupedListContentHorizontal,
    },
    rowPressed: {
      opacity: 0.85,
    },
    dragHandleColumn: {
      width: DRAG_HANDLE_COLUMN,
      height: DRAG_HANDLE_COLUMN,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listIconWrap: {
      width: ROW_ICON_SIZE,
      height: ROW_ICON_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deletePressable: {
      width: DELETE_HIT_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
    },
    emptyWrap: {
      paddingHorizontal: Paddings.screen,
    },
    emptyText: {
      ...typography.getTextStyle('body-large'),
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
  });
