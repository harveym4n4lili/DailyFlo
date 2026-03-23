/**
 * List create – full-screen modal on browse stack.
 * GroupedList: name + description; second list: Favorited only.
 * Header: MainCloseButton (left), MainSubmitButton / checkmark (right), same glass circle chrome.
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, ScrollView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useThemeColors, useSemanticColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
import { MainCloseButton, MainSubmitButton } from '@/components/ui/button';
import { GroupedList } from '@/components/ui/list/GroupedList';
import { SFSymbolIcon } from '@/components/ui/icon';
import { Description } from '@/components/features/tasks/TaskScreen/sections/Description';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { LIST_CREATE_OPENED_FROM_BROWSE } from './navigationParams';
import type { ListColor, TaskColor } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLists } from '@/store/hooks';

const HEADER_ROW_HEIGHT = 42;
const HEADER_TOP = Paddings.screen;
const FADE_OVERFLOW = 48;
const TOP_SECTION_HEIGHT = HEADER_TOP + HEADER_ROW_HEIGHT + FADE_OVERFLOW;

// default list accent for Description cursor theming until list color is wired to create API
const DEFAULT_LIST_COLOR: ListColor = 'blue';

export default function ListCreateScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const semantic = useSemanticColors();
  const typography = useTypography();
  const styles = createStyles();

  const { openedFrom } = useLocalSearchParams<{ openedFrom?: string }>();
  const openedFromBrowse = openedFrom === LIST_CREATE_OPENED_FROM_BROWSE;

  const [listTitle, setListTitle] = useState('');
  // holds notes for the new list; Description keeps its own display state but mirrors here for submit/api later
  const [listDescription, setListDescription] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);

  const { createList, isCreating } = useLists();

  // POST /lists/ via redux thunk; unwrap rejects on network/validation errors
  const handleSubmit = useCallback(() => {
    const name = listTitle.trim();
    if (!name || isCreating) return;
    void (async () => {
      try {
        await createList({
          name,
          description: listDescription.trim() || undefined,
          color: DEFAULT_LIST_COLOR,
          metadata: { favorited: isFavorited },
        });
        router.back();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not create list';
        Alert.alert('Create list failed', msg);
      }
    })();
  }, [listTitle, listDescription, isFavorited, isCreating, createList, router]);

  const canSubmit = listTitle.trim().length > 0 && !isCreating;

  const topSectionHeight = TOP_SECTION_HEIGHT;
  const headerTitleStyle = {
    ...typography.getTextStyle('heading-3'),
    color: themeColors.text.primary(),
  };

  const listGroupProps = {
    backgroundColor: themeColors.background.primarySecondaryBlend(),
    separatorColor: themeColors.border.primary(),
    separatorInsetRight: Paddings.groupedListContentHorizontal,
    separatorVariant: 'solid' as const,
    borderRadius: 24,
    minimalStyle: false,
    separatorConsiderIconColumn: true,
    iconColumnWidth: 30,
  };

  // title row has no leading icon — don't indent the separator as if it did; favorited-only list keeps icon-column alignment
  const listNameDescriptionGroupProps = {
    ...listGroupProps,
    separatorConsiderIconColumn: false,
    contentMinHeight: 0,
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary() }]}>
      <View style={styles.contentArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            // below close/title row + 24px gap (was 16px + 8px breathing room above list title)
            { paddingTop: HEADER_TOP + HEADER_ROW_HEIGHT + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          // same as TaskScreenContent: "always" traps the keyboard open on scroll taps; "handled" dismisses on outside tap but still lets TextInput refocus
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {/* list name + description: same GroupedList chrome as task form; description row reuses TaskScreen Description */}
          <View style={styles.groupedListSectionFirst}>
            <GroupedList containerStyle={styles.listContainer} {...listNameDescriptionGroupProps}>
              <View style={styles.listNameRow}>
                <TextInput
                  value={listTitle}
                  onChangeText={setListTitle}
                  placeholder="Name"
                  placeholderTextColor={themeColors.text.tertiary()}
                  selectionColor="#FFFFFF"
                  cursorColor="#FFFFFF"
                  selectionHandleColor="#FFFFFF"
                  underlineColorAndroid="transparent"
                  accessibilityLabel="Name"
                  accessibilityHint={
                    openedFromBrowse ? 'Opened from the Browse tab. Type a name for your new list.' : undefined
                  }
                  style={[
                    // same as FormDetailButton label row: getTextStyle('body-large') + themeColors.text.primary()
                    getTextStyle('body-large'),
                    {
                      color: themeColors.text.primary(),
                      flex: 1,
                      minWidth: 0,
                      paddingVertical: Paddings.none,
                      paddingHorizontal: Paddings.none,
                      margin: 0,
                      ...(Platform.OS === 'android' && {
                        includeFontPadding: false,
                        textAlignVertical: 'center',
                      }),
                    },
                  ]}
                  autoFocus
                  returnKeyType="next"
                />
              </View>
              <Description
                description={listDescription}
                onDescriptionChange={setListDescription}
                isEditing
                taskColor={DEFAULT_LIST_COLOR as TaskColor}
              />
            </GroupedList>
          </View>

          <View style={styles.groupedListSection}>
            <GroupedList containerStyle={styles.listContainer} {...listGroupProps}>
              {/* single row: star + label + react-native Switch */}
              <View style={styles.favoritedRow}>
                <View style={styles.favoritedIconWrap}>
                  <SFSymbolIcon
                    name="star"
                    size={20}
                    color={themeColors.text.primary()}
                    fallback={<Ionicons name="star-outline" size={20} color={themeColors.text.primary()} />}
                  />
                </View>
                <Text
                  style={[styles.favoritedLabel, { color: themeColors.text.primary() }]}
                  numberOfLines={1}
                >
                  Favorited
                </Text>
                <Switch
                  value={isFavorited}
                  onValueChange={setIsFavorited}
                  accessibilityLabel="Favorite this list"
                  trackColor={{
                    false: themeColors.interactive.tertiary(),
                    true: semantic.success(500),
                  }}
                  thumbColor={themeColors.background.elevated()}
                  ios_backgroundColor={themeColors.interactive.tertiary()}
                />
              </View>
            </GroupedList>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <View collapsable={false} style={[styles.headerOverlay, { height: topSectionHeight }]} pointerEvents="box-none">
        {/* box-none + blur pointerEvents none: taps fall through to ScrollView except where title/buttons sit (task-create style stacking) */}
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
        <View style={[styles.headerRow, { top: HEADER_TOP }]} pointerEvents="box-none">
          <View style={styles.headerPlaceholder} pointerEvents="none" />
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={headerTitleStyle}>New List</Text>
          </View>
          <View style={styles.headerPlaceholder} pointerEvents="none" />
        </View>
        <View style={styles.headerActionsContainer} pointerEvents="box-none">
          <MainCloseButton onPress={() => router.back()} top={Paddings.screen} left={Paddings.screen} />
          <MainSubmitButton
            onPress={handleSubmit}
            disabled={!canSubmit}
            top={Paddings.screen}
            right={Paddings.screen}
            accessibilityLabel="Create list"
          />
        </View>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    // zIndex 0: scroll + title sit in predictable layer under header chrome (matches task screen: scroll under header overlay)
    contentArea: {
      flex: 1,
      zIndex: 0,
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
    groupedListSectionFirst: {
      marginTop: 0,
    },
    // list title row: no left icon — same body-large as FormDetailButton label; full width under GroupedList padding
    // single full-width row: no icon column — only GroupedList content horizontal padding (16)
    listNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    groupedListSection: {
      marginTop: Paddings.section,
    },
    listContainer: {
      marginVertical: 0,
    },
    favoritedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      flex: 1,
    },
    favoritedIconWrap: {
      marginRight: Paddings.groupedListIconTextSpacing,
    },
    favoritedLabel: {
      ...getTextStyle('body-large'),
      flex: 1,
      minWidth: 0,
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
    bottomSpacer: {
      height: 200,
    },
  });
