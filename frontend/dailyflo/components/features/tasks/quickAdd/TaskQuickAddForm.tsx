/**
 * task quick-add form body (ui only).
 * pure presentational: inputs, chip row, bottom toolbar — no api or navigation yet.
 * title row matches TaskScreenContent: checkbox + heading-2 with Inter semibold (same as task create).
 */

import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { Checkbox, CHECKBOX_SIZE_TASK_VIEW } from '@/components/ui/button';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getFontFamilyWithWeight, getTextStyle } from '@/constants/Typography';

const CHIP_ROWS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'date', label: 'Date', icon: 'calendar-outline' },
  { key: 'deadline', label: 'Deadline', icon: 'flag-outline' },
  { key: 'attach', label: 'Attachment', icon: 'attach-outline' },
  { key: 'prio', label: 'Priority', icon: 'flag' },
];

export function TaskQuickAddForm() {
  const themeColors = useThemeColors();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleChecked, setTitleChecked] = useState(false);

  const titleFontPlatform =
    Platform.OS === 'web' ? 'web' : Platform.OS === 'android' ? 'android' : 'ios';

  // chips use the same elevated pill color as task-create-test so they read on glass
  const chipBg = themeColors.withOpacity(themeColors.background.elevated(), 0.55);

  return (
    <View style={styles.formColumn} pointerEvents="box-none">
      <View style={styles.titleRow}>
        <View style={styles.checkboxWrap}>
          <Checkbox
            size={CHECKBOX_SIZE_TASK_VIEW}
            checked={titleChecked}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTitleChecked((v) => !v);
            }}
          />
        </View>
        <View style={styles.titleInputWrap}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task name"
            placeholderTextColor={themeColors.text.tertiary()}
            selectionColor="#FFFFFF"
            cursorColor="#FFFFFF"
            style={[
              getTextStyle('heading-2'),
              styles.titleInput,
              {
                color: themeColors.text.primary(),
                fontFamily: getFontFamilyWithWeight('semibold', titleFontPlatform),
                paddingBottom: Paddings.none,
                paddingHorizontal: Paddings.none,
                maxHeight: 68,
              },
            ]}
            multiline
            numberOfLines={2}
            scrollEnabled
            autoFocus
            returnKeyType="next"
          />
        </View>
      </View>

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        placeholderTextColor={themeColors.text.tertiary()}
        selectionColor="#FFFFFF"
        cursorColor="#FFFFFF"
        style={[
          getTextStyle('body-large'),
          styles.descInput,
          { color: themeColors.text.primary() },
        ]}
        multiline
      />

      {/* horizontal chip row: scroll on narrow widths; keyboardShouldPersistTaps keeps focus usable */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chipsRow}
      >
        {CHIP_ROWS.map((c) => (
          <Pressable
            key={c.key}
            style={[styles.chip, { backgroundColor: chipBg }]}
            accessibilityRole="button"
            accessibilityLabel={c.label}
          >
            <Ionicons name={c.icon} size={18} color={themeColors.text.primary()} />
            <Text style={[getTextStyle('body-small'), { color: themeColors.text.primary() }]}>{c.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.separator, { backgroundColor: themeColors.border.primary() }]} />

      <View style={styles.bottomBar}>
        <Pressable style={styles.inboxPill} accessibilityRole="button" accessibilityLabel="List destination">
          <Ionicons name="file-tray-outline" size={20} color={themeColors.text.primary()} />
          <Text style={[getTextStyle('body-medium'), { color: themeColors.text.primary() }]}>Inbox</Text>
          <Ionicons name="chevron-down" size={18} color={themeColors.text.secondary()} />
        </Pressable>
        <Pressable
          style={[styles.fabPlaceholder, { backgroundColor: themeColors.primaryButton.fill() }]}
          accessibilityRole="button"
          accessibilityLabel="Voice or quick action"
        >
          <Ionicons name="mic-outline" size={22} color={themeColors.primaryButton.icon()} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formColumn: {
    paddingHorizontal: Paddings.screen,
    paddingTop: Platform.OS === 'ios' ? 16 : 14,
    paddingBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxWrap: {
    width: CHECKBOX_SIZE_TASK_VIEW,
    marginTop: -10,
    height: CHECKBOX_SIZE_TASK_VIEW,
    marginRight: Paddings.groupedListIconTextSpacing + 4,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInputWrap: {
    flex: 1,
    minWidth: 0,
  },
  titleInput: {
    paddingVertical: 8,
    minHeight: 44,
  },
  descInput: {
    paddingVertical: 8,
    minHeight: 40,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
