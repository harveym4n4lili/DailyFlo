/**
 * task quick-add prototype (form sheet variant).
 *
 * sheet height: native stack uses sheetAllowedDetents: 'fitToContents' (see _layout.tsx). react-native-screens
 * measures this screen’s root layout height — so we must NOT use flex:1 on wrappers (that forces full-window height).
 * ios usually lifts/resizes the form sheet with the keyboard; avoid flex:1 + manual detent math that forced a full-height sheet.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useGuardedRouter } from '@/hooks/useGuardedRouter';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import { getTextStyle } from '@/constants/Typography';

const SHEET_TOP_RADIUS = 16;
const BLUR_INTENSITY = Platform.OS === 'ios' ? 55 : 40;

const CHIP_ROWS: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'date', label: 'Date', icon: 'calendar-outline' },
  { key: 'deadline', label: 'Deadline', icon: 'flag-outline' },
  { key: 'attach', label: 'Attachment', icon: 'attach-outline' },
  { key: 'prio', label: 'Priority', icon: 'flag' },
];

export default function TaskCreateTestScreen() {
  const router = useGuardedRouter();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const titleRef = useRef<TextInput>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useFocusEffect(
    useCallback(() => {
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
      const sub = Keyboard.addListener(hideEvent, () => {
        requestAnimationFrame(() => titleRef.current?.focus());
      });
      return () => sub.remove();
    }, []),
  );

  const tint = themeColors.isDark ? 'dark' : 'light';
  const chipBg = themeColors.withOpacity(themeColors.background.elevated(), 0.55);
  const glassTint = themeColors.withOpacity(themeColors.background.primary(), 0.28);

  return (
    <View style={styles.hugRoot} pointerEvents="box-none">
      <View
        style={[
          styles.sheetCard,
          {
            borderTopLeftRadius: SHEET_TOP_RADIUS,
            borderTopRightRadius: SHEET_TOP_RADIUS,
          },
        ]}
      >
        <BlurView tint={tint} intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
        <View style={[styles.glassTint, { backgroundColor: glassTint }]} pointerEvents="none" />

        <View
          style={[
            styles.formColumn,
            {
              paddingTop: Math.max(insets.top, 12),
              paddingHorizontal: Paddings.screen,
              paddingBottom: 12,
            },
          ]}
        >
            <View style={styles.closeRow}>
              <View style={{ width: 48 }} />
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={styles.closeHit}
              >
                <Text style={[getTextStyle('body-medium'), { color: themeColors.text.primary() }]}>Close</Text>
              </Pressable>
            </View>

            <TextInput
              ref={titleRef}
              value={title}
              onChangeText={setTitle}
              placeholder="Task name"
              placeholderTextColor={themeColors.text.tertiary()}
              selectionColor="#FFFFFF"
              cursorColor="#FFFFFF"
              style={[
                getTextStyle('heading-2'),
                styles.titleInput,
                { color: themeColors.text.primary() },
              ]}
              autoFocus
              returnKeyType="next"
            />

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
                accessibilityLabel="Add"
              >
                <Ionicons name="mic-outline" size={22} color={themeColors.primaryButton.icon()} />
              </Pressable>
            </View>
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // no flex:1 — height must come from children so fitToContents can measure the real sheet size
  hugRoot: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  sheetCard: {
    width: '100%',
    overflow: 'hidden',
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
  },
  formColumn: {},
  closeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeHit: {
    marginLeft: 'auto',
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
