/**
 * Navigation settings — reorder/remove navbar tabs (browse pinned). pushed from browse/settings.
 * phase 1: local draft + apply commits in-screen only; phase 3: apply PATCHes navigation_preferences.
 */

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton, MainSubmitButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import { SFSymbolIcon, GearIcon } from '@/components/ui/Icon';
import { IosBrowseBackStackToolbar } from '@/components/navigation/IosBrowseBackStackToolbar';
import {
  IosBrowseModalTrailingStackToolbar,
} from '@/components/navigation/IosBrowseModalStackToolbars';
import { Paddings } from '@/constants/Paddings';
import { useAppDispatch, useAppSelector } from '@/store';
import { patchUserNavigationPreferences } from '@/store/slices/auth/authSlice';

import { NavigationTabRow } from './NavigationTabRow';
import {
  ADDABLE_NAV_TAB_KEYS,
  NAV_TAB_REGISTRY,
  PINNED_NAV_TAB,
  type NavTabKey,
} from './navigationTabRegistry';
import {
  mergeNavTabOrderFromEdit,
  navTabOrdersEqual,
  normalizeNavTabOrder,
  resolveNavTabOrderFromPreferences,
  splitNavTabOrderForEdit,
} from './navigationPreferenceUtils';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;
const DRAG_ACTIVE_SCALE = 1.02;
const GROUPED_LIST_RADIUS = 24;

export function NavigationSettingsScreen() {
  const router = useGuardedRouter();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const typography = useTypography();
  const styles = createStyles(typography);

  const savedPrefs = useAppSelector((s) => s.auth.user?.preferences?.navigationPreferences);
  const isSaving = useAppSelector((s) => s.auth.isUpdatingProfile);

  const savedOrder = useMemo(
    () => resolveNavTabOrderFromPreferences(savedPrefs),
    [savedPrefs]
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [committedOrder, setCommittedOrder] = useState<NavTabKey[]>(savedOrder);
  const [draftOrder, setDraftOrder] = useState<NavTabKey[]>(savedOrder);

  // when redux prefs hydrate (login / patch fulfilled), sync local state
  React.useEffect(() => {
    setCommittedOrder(savedOrder);
    if (!isEditMode) {
      setDraftOrder(savedOrder);
    }
  }, [savedOrder, isEditMode]);

  const { draggableKeys, pinnedBrowse } = splitNavTabOrderForEdit(draftOrder);

  // local display list for DraggableFlatList — avoids one-frame jump after drop (same as manage-lists)
  const displayDataRef = useRef<NavTabKey[]>([]);
  const [displayDraggableKeys, setDisplayDraggableKeys] = useState<NavTabKey[]>(draggableKeys);

  useLayoutEffect(() => {
    const nextSig = draggableKeys.join(',');
    const prevSig = displayDataRef.current.join(',');
    if (nextSig === prevSig && draggableKeys.length === displayDataRef.current.length) {
      return;
    }
    displayDataRef.current = draggableKeys;
    setDisplayDraggableKeys(draggableKeys);
  }, [draggableKeys]);

  const hasChanges = !navTabOrdersEqual(draftOrder, committedOrder);
  const groupedListIconColor = getMarpleBrandColor(500);

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

  const listGroupProps = useMemo(
    () => ({
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      separatorColor: themeColors.border.primary(),
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      borderRadius: GROUPED_LIST_RADIUS,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: 30,
      containerStyle: styles.listContainer,
    }),
    [styles.listContainer, themeColors]
  );

  const handleBack = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard changes?',
        'Your navigation bar changes will not be saved.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
      return;
    }
    router.back();
  }, [hasChanges, router]);

  const handleEditPress = useCallback(() => {
    if (isEditMode && !hasChanges) {
      setIsEditMode(false);
      return;
    }
    setIsEditMode(true);
  }, [hasChanges, isEditMode]);

  const handleApply = useCallback(async () => {
    if (!hasChanges || isSaving) return;
    const normalized = normalizeNavTabOrder(draftOrder);
    try {
      await dispatch(
        patchUserNavigationPreferences({
          tabOrder: normalized,
          pinnedTab: PINNED_NAV_TAB,
        })
      ).unwrap();
      setCommittedOrder(normalized);
      setDraftOrder(normalized);
      setIsEditMode(false);
    } catch (err) {
      Alert.alert(
        'Could not save',
        typeof err === 'string' ? err : 'Navigation settings could not be saved. Try again.'
      );
    }
  }, [dispatch, draftOrder, hasChanges, isSaving]);

  const handleDeleteTab = useCallback((key: NavTabKey) => {
    if (key === PINNED_NAV_TAB) return;
    setDraftOrder((prev) => prev.filter((k) => k !== key));
  }, []);

  const onDragEnd = useCallback(({ data }: { data: NavTabKey[] }) => {
    displayDataRef.current = data;
    setDisplayDraggableKeys(data);
    setDraftOrder(mergeNavTabOrderFromEdit(data));
  }, []);

  const availableToAdd = useMemo(
    () => ADDABLE_NAV_TAB_KEYS.filter((key) => !draftOrder.includes(key)),
    [draftOrder]
  );

  const handleAddPress = useCallback(() => {
    if (availableToAdd.length === 0) return;
    Alert.alert(
      'Add tab',
      'Choose a tab to add to your navigation bar.',
      [
        ...availableToAdd.map((key) => ({
          text: NAV_TAB_REGISTRY[key].label,
          onPress: () => {
            setDraftOrder((prev) => {
              const { draggableKeys: drag } = splitNavTabOrderForEdit(prev);
              return mergeNavTabOrderFromEdit([...drag, key]);
            });
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [availableToAdd]);

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<NavTabKey>) => {
      const index = getIndex() ?? 0;
      const isPinned = item === PINNED_NAV_TAB;
      return (
        <ScaleDecorator activeScale={DRAG_ACTIVE_SCALE}>
          <NavigationTabRow
            tabKey={item}
            iconColor={groupedListIconColor}
            mode="edit"
            showDelete={!isPinned}
            onLongPressDrag={isPinned ? undefined : drag}
            onDelete={() => handleDeleteTab(item)}
            isDragActive={isActive}
            showSeparator={index < displayDraggableKeys.length - 1}
            separatorColor={themeColors.border.primary()}
          />
        </ScaleDecorator>
      );
    },
    [
      displayDraggableKeys.length,
      groupedListIconColor,
      handleDeleteTab,
      themeColors,
    ]
  );

  const cardBg = themeColors.background.primarySecondaryBlend();
  const separatorColor = themeColors.border.primary();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerTitle: 'Navigation',
            headerTitleStyle,
            headerLargeTitle: false,
          }}
        />
      ) : null}

      {isFocused ? <IosBrowseBackStackToolbar onPress={handleBack} /> : null}
      {isFocused && hasChanges && !isSaving ? (
        <IosBrowseModalTrailingStackToolbar
          icon="checkmark"
          onPress={() => void handleApply()}
          brandActive
          accessibilityLabel="Apply navigation changes"
        />
      ) : isFocused && !hasChanges ? (
        <IosBrowseModalTrailingStackToolbar
          icon="square.and.pencil"
          onPress={handleEditPress}
          accessibilityLabel={isEditMode ? 'Done editing navigation' : 'Edit navigation bar'}
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
        >
          <GroupedListHeader title="Navigation Bar" />
          <View style={styles.groupedListSection}>
            {!isEditMode ? (
              <GroupedList {...listGroupProps}>
                {draftOrder.map((key) => (
                  <FormDetailButton
                    key={key}
                    iconComponent={
                      <SFSymbolIcon
                        name={NAV_TAB_REGISTRY[key].sfSymbol as any}
                        size={18}
                        color={groupedListIconColor}
                        fallback={
                          <GearIcon size={18} color={groupedListIconColor} />
                        }
                      />
                    }
                    label={NAV_TAB_REGISTRY[key].label}
                    value=""
                    onPress={() => {}}
                    showChevron={false}
                  />
                ))}
                <FormDetailButton
                  key="add"
                  iconComponent={
                    <SFSymbolIcon
                      name="plus"
                      size={18}
                      color={groupedListIconColor}
                      fallback={<GearIcon size={18} color={groupedListIconColor} />}
                    />
                  }
                  label="Add"
                  value=""
                  onPress={availableToAdd.length > 0 ? handleAddPress : () => {}}
                  showChevron={false}
                />
              </GroupedList>
            ) : (
              <View style={[styles.editCard, { backgroundColor: cardBg, borderRadius: GROUPED_LIST_RADIUS }]}>
                <DraggableFlatList
                  data={displayDraggableKeys}
                  keyExtractor={(item) => item}
                  renderItem={renderDraggableItem}
                  onDragEnd={onDragEnd}
                  scrollEnabled={false}
                  activationDistance={12}
                />
                <NavigationTabRow
                  tabKey={pinnedBrowse}
                  iconColor={groupedListIconColor}
                  mode="edit"
                  showDelete={false}
                  showSeparator={displayDraggableKeys.length > 0}
                  separatorColor={separatorColor}
                />
              </View>
            )}
          </View>
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
                <Text style={headerTitleStyle}>Navigation</Text>
              </View>
              <View style={styles.headerPlaceholder} pointerEvents="none" />
            </View>
            <View style={styles.headerActionsContainer} pointerEvents="box-none">
              <MainBackButton onPress={handleBack} top={Paddings.screen} left={Paddings.screen} />
              {hasChanges && !isSaving ? (
                <View style={styles.androidApplyButtonAnchor} pointerEvents="box-none">
                  <MainSubmitButton
                    layout="inline"
                    onPress={() => void handleApply()}
                    brandActive
                    animateVisibility={false}
                    accessibilityLabel="Apply navigation changes"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={handleEditPress}
                  style={styles.androidEditButton}
                  accessibilityRole="button"
                  accessibilityLabel={isEditMode ? 'Done editing navigation' : 'Edit navigation bar'}
                >
                  <Text style={[styles.androidEditLabel, { color: groupedListIconColor }]}>Edit</Text>
                </Pressable>
              )}
            </View>
          </>
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
      zIndex: 0,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Paddings.screen,
      flexGrow: 1,
    },
    groupedListSection: {
      paddingTop: Paddings.groupedListHeaderContentGap,
    },
    listContainer: {
      marginVertical: 0,
    },
    editCard: {
      overflow: 'hidden',
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
    androidApplyButtonAnchor: {
      position: 'absolute',
      top: Paddings.screen,
      right: Paddings.screen,
    },
    androidEditButton: {
      position: 'absolute',
      top: Paddings.screen,
      right: Paddings.screen,
      height: 42,
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    androidEditLabel: {
      ...typography.getTextStyle('body-large'),
      fontWeight: '600',
    },
  });

export default NavigationSettingsScreen;
