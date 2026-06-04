/**
 * Navigation settings — reorder/remove navbar tabs (browse always present). pushed from browse/settings.
 */

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { Stack, type Href } from 'expo-router';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainBackButton, MainSubmitButton } from '@/components/ui/Button';
import { GroupedList, FormDetailButton, GroupedListHeader } from '@/components/ui/List/GroupedList';
import SolidSeparator from '@/components/ui/borders/SolidSeparator';
import { SFSymbolIcon, GearIcon } from '@/components/ui/Icon';
import { IosNavigationSettingsStackToolbar } from './IosNavigationSettingsStackToolbar';
import { Paddings } from '@/constants/Paddings';
import { LAYOUT_TRANSITION_SPRING } from '@/constants/LayoutTransitions';

import { useNavigationSettingsDraft } from './NavigationSettingsDraftContext';
import { NavigationTabRow } from './NavigationTabRow';
import {
  NAV_TAB_REGISTRY,
  PINNED_NAV_TAB,
  type NavTabKey,
} from './navigationTabRegistry';
import {
  normalizeNavTabOrder,
} from './navigationPreferenceUtils';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;
const DRAG_ACTIVE_SCALE = 1.05;
const GROUPED_LIST_RADIUS = 24;
const GROUPED_LIST_ICON_COLUMN = 30;
const TAB_BAR_OPTIONS_HREF = '/(tabs)/browse/settings/navigation/tab-bar-options' as Href;

export function NavigationSettingsScreen() {
  const router = useGuardedRouter();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { getMarpleBrandColor } = useColorPalette();
  const typography = useTypography();
  const styles = createStyles(typography, themeColors);
  const {
    draftOrder,
    setDraftOrder,
    hasChanges,
    isEditMode,
    setIsEditMode,
    saveDraftIfNeeded,
  } = useNavigationSettingsDraft();

  const editOrder = useMemo(() => normalizeNavTabOrder(draftOrder), [draftOrder]);

  const displayDataRef = useRef<NavTabKey[]>([]);
  const [displayEditKeys, setDisplayEditKeys] = useState<NavTabKey[]>(editOrder);
  // lock flat list height to its content so scrollEnabled={false} cannot rubber-band inside a tall viewport
  const [editListContentHeight, setEditListContentHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const nextSig = editOrder.join(',');
    const prevSig = displayDataRef.current.join(',');
    if (nextSig === prevSig && editOrder.length === displayDataRef.current.length) {
      return;
    }
    displayDataRef.current = editOrder;
    setDisplayEditKeys(editOrder);
  }, [editOrder]);

  React.useEffect(() => {
    if (!isEditMode) {
      setEditListContentHeight(undefined);
    }
  }, [isEditMode]);

  React.useEffect(() => {
    setEditListContentHeight(undefined);
  }, [displayEditKeys.join(',')]);

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

  // shared grouped-list chrome — same tokens as view mode GroupedList below
  const groupedListWrapperProps = useMemo(
    () => ({
      borderRadius: GROUPED_LIST_RADIUS,
      separatorColor: themeColors.border.primary(),
      separatorInsetLeft: Paddings.groupedListContentHorizontal + GROUPED_LIST_ICON_COLUMN,
      separatorInsetRight: Paddings.groupedListContentHorizontal,
      separatorVariant: 'solid' as const,
      backgroundColor: themeColors.background.primarySecondaryBlend(),
      contentPaddingHorizontal: Paddings.groupedListContentHorizontal,
      itemPadding: 'root' as const,
      contentMinHeight: 44,
    }),
    [themeColors]
  );

  // delete column + icon gap + tab icon column — keeps separator aligned under labels
  const editSeparatorInsetLeft =
    Paddings.groupedListContentHorizontal +
    Paddings.groupedListIconSize +
    Paddings.groupedListIconTextSpacing +
    GROUPED_LIST_ICON_COLUMN;

  const listGroupProps = useMemo(
    () => ({
      ...groupedListWrapperProps,
      minimalStyle: false,
      separatorConsiderIconColumn: true,
      iconColumnWidth: GROUPED_LIST_ICON_COLUMN,
      containerStyle: styles.listContainer,
    }),
    [groupedListWrapperProps, styles.listContainer]
  );

  // view rows render inside the shared animated shell — shell owns background + radius
  const viewListInsideShellProps = useMemo(
    () => ({
      ...listGroupProps,
      backgroundColor: 'transparent',
      borderRadius: 0,
    }),
    [listGroupProps]
  );

  const handleBack = useCallback(() => {
    if (isEditMode) return;
    // beforeRemove listener saves the draft when this pop actually runs
    router.back();
  }, [isEditMode, router]);

  const handleEditPress = useCallback(() => {
    setIsEditMode(true);
  }, [setIsEditMode]);

  // tick exits edit mode only — draft persists until the user leaves this screen
  const handleApply = useCallback(() => {
    setIsEditMode(false);
  }, [setIsEditMode]);

  // swipe-back / pop: save draft before leaving navigation settings (same as back button)
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;

      e.preventDefault();
      void (async () => {
        const saved = await saveDraftIfNeeded();
        if (saved) {
          navigation.dispatch(e.data.action);
        }
      })();
    });

    return unsubscribe;
  }, [hasChanges, navigation, saveDraftIfNeeded]);

  const handleDeleteTab = useCallback((key: NavTabKey) => {
    if (key === PINNED_NAV_TAB) return;
    setDraftOrder((prev) => prev.filter((k) => k !== key));
  }, [setDraftOrder]);

  const onDragEnd = useCallback(({ data }: { data: NavTabKey[] }) => {
    const normalized = normalizeNavTabOrder(data);
    displayDataRef.current = normalized;
    setDisplayEditKeys(normalized);
    setDraftOrder(normalized);
  }, [setDraftOrder]);

  const keyExtractor = useCallback((item: NavTabKey) => item, []);

  const handleAddPress = useCallback(() => {
    router.push(TAB_BAR_OPTIONS_HREF);
  }, [router]);

  const groupedListCardBg = themeColors.background.primarySecondaryBlend();

  const groupedListShellStyle = useMemo(
    () => [
      styles.groupedListShell,
      {
        backgroundColor: groupedListCardBg,
        borderRadius: GROUPED_LIST_RADIUS,
      },
    ],
    [groupedListCardBg, styles.groupedListShell]
  );

  const pageInnerStyle = useMemo(
    () => ({
      paddingHorizontal: Paddings.screen,
      paddingTop: scrollTopPadding,
      paddingBottom: isEditMode ? insets.bottom + 24 : 120 + insets.bottom,
    }),
    [insets.bottom, isEditMode, scrollTopPadding]
  );

  const renderEditListSeparator = useCallback(
    () => (
      <SolidSeparator
        paddingLeft={editSeparatorInsetLeft}
        paddingRight={Paddings.groupedListContentHorizontal}
        color={themeColors.border.primary()}
      />
    ),
    [editSeparatorInsetLeft, themeColors]
  );

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<NavTabKey>) => {
      const isBrowse = item === PINNED_NAV_TAB;

      return (
        <ScaleDecorator activeScale={DRAG_ACTIVE_SCALE}>
          <View style={styles.editRowContent}>
            <NavigationTabRow
              tabKey={item}
              iconColor={groupedListIconColor}
              showDelete={!isBrowse}
              reserveDeleteColumn={isBrowse}
              onDrag={drag}
              onDelete={() => handleDeleteTab(item)}
              isDragActive={isActive}
            />
          </View>
        </ScaleDecorator>
      );
    },
    [groupedListIconColor, handleDeleteTab, styles.editRowContent]
  );

  const listHeader = useMemo(
    () => <GroupedListHeader title="Navigation Bar" />,
    []
  );

  const listFooterSubtext = useMemo(
    () => (
      <Text style={styles.listFooterSubtext}>
        {'Edit the navigation tab bar to align with your workflow. Tap "Edit" to rearrange where needed.'}
      </Text>
    ),
    [styles.listFooterSubtext]
  );

  const editDraggableListStyle = useMemo(
    () => [
      styles.editDraggableList,
      editListContentHeight != null ? { height: editListContentHeight } : null,
    ],
    [editListContentHeight, styles.editDraggableList]
  );

  const handleEditListContentSizeChange = useCallback((_width: number, height: number) => {
    setEditListContentHeight(Math.round(height));
  }, []);

  const renderViewModeRows = () => (
    <GroupedList {...viewListInsideShellProps}>
      {draftOrder.map((key) => (
        <FormDetailButton
          key={key}
          iconComponent={
            <SFSymbolIcon
              name={NAV_TAB_REGISTRY[key].sfSymbol as any}
              size={18}
              color={groupedListIconColor}
              fallback={<GearIcon size={18} color={groupedListIconColor} />}
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
        onPress={handleAddPress}
        showChevron={false}
      />
    </GroupedList>
  );

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

      {isFocused ? (
        <IosNavigationSettingsStackToolbar
          isEditMode={isEditMode}
          onBack={handleBack}
          onEdit={handleEditPress}
          onApply={handleApply}
        />
      ) : null}

      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={pageInnerStyle}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
          scrollEnabled={!isEditMode}
          bounces={!isEditMode}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {listHeader}
          <View style={styles.groupedListSection}>
            <Animated.View layout={LAYOUT_TRANSITION_SPRING} style={groupedListShellStyle}>
            {isEditMode ? (
              <Animated.View
                key="navigation-edit-list"
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(180)}
              >
                <DraggableFlatList
                  data={displayEditKeys}
                  keyExtractor={keyExtractor}
                  renderItem={renderDraggableItem}
                  ItemSeparatorComponent={renderEditListSeparator}
                  onDragEnd={onDragEnd}
                  onContentSizeChange={handleEditListContentSizeChange}
                  dragItemOverflow
                  scrollEnabled={false}
                  bounces={false}
                  alwaysBounceVertical={false}
                  overScrollMode="never"
                  nestedScrollEnabled={false}
                  extraData={displayEditKeys.join(',')}
                  style={editDraggableListStyle}
                  contentContainerStyle={styles.editDraggableListContent}
                  contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="navigation-view-list"
                entering={FadeIn.duration(220)}
                exiting={FadeOut.duration(180)}
              >
                {renderViewModeRows()}
              </Animated.View>
            )}
          </Animated.View>
          {listFooterSubtext}
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
              {!isEditMode ? (
                <Animated.View
                  entering={FadeIn.duration(220)}
                  exiting={FadeOut.duration(180)}
                  style={styles.androidBackButtonAnchor}
                >
                  <MainBackButton onPress={handleBack} top={0} left={0} />
                </Animated.View>
              ) : null}
              <View style={styles.androidTrailingButtonAnchor} pointerEvents="box-none">
                {!isEditMode ? (
                  <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}>
                    <Pressable
                      onPress={handleEditPress}
                      style={styles.androidEditButtonInner}
                      accessibilityRole="button"
                      accessibilityLabel="Edit navigation bar"
                    >
                      <Text style={[styles.androidEditLabel, { color: groupedListIconColor }]}>Edit</Text>
                    </Pressable>
                  </Animated.View>
                ) : (
                  <MainSubmitButton
                    layout="inline"
                    top={0}
                    right={0}
                    onPress={handleApply}
                    brandActive
                    animateVisibility
                    accessibilityLabel="Done editing navigation"
                  />
                )}
              </View>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (
  typography: ReturnType<typeof useTypography>,
  themeColors: ReturnType<typeof useThemeColors>
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listFooterSubtext: {
      ...typography.getTextStyle('body-medium'),
      color: themeColors.text.tertiary(),
      paddingHorizontal: Paddings.touchTargetSmall,
      paddingTop: Paddings.groupedListHeaderContentGap,
    },
    contentArea: {
      flex: 1,
      zIndex: 0,
    },
    scroll: {
      flex: 1,
    },
    groupedListShell: {
      overflow: 'visible',
    },
    groupedListSection: {
      // match browse/settings — header sits directly above grouped list (no extra gap)
      paddingTop: 0,
    },
    listContainer: {
      marginVertical: 0,
    },
    editDraggableList: {
      backgroundColor: 'transparent',
      flexGrow: 0,
      flexShrink: 0,
    },
    editDraggableListContent: {
      flexGrow: 0,
    },
    editRowContent: {
      paddingHorizontal: Paddings.groupedListContentHorizontal,
      paddingVertical: Paddings.groupedListContentVertical,
      minHeight: 44,
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
    androidBackButtonAnchor: {
      position: 'absolute',
      top: Paddings.screen,
      left: Paddings.screen,
    },
    androidTrailingButtonAnchor: {
      position: 'absolute',
      top: Paddings.screen,
      right: Paddings.screen,
      height: 42,
      justifyContent: 'center',
    },
    androidEditButtonInner: {
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
