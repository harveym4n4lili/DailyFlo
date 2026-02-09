/**
 * Alert select screen content. Used by app/alert-select (root-level route).
 * Draft via CreateTaskDraftProvider.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { useCreateTaskDraft } from '@/app/task/CreateTaskDraftContext';
import { DashedSeparator } from '@/components/ui/borders';
import { ALERT_OPTIONS } from './alertOptions';

export function AlertSelectScreen() {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { draft, setAlerts } = useCreateTaskDraft();

  const selectedAlerts = draft.alerts ?? [];
  const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;
  const backgroundColor = useLiquidGlass
    ? 'transparent'
    : themeColors.background.secondary();

  const handleToggleAlert = (alertId: string) => {
    const newAlerts = selectedAlerts.includes(alertId)
      ? selectedAlerts.filter((id) => id !== alertId)
      : [...selectedAlerts, alertId];
    setAlerts(newAlerts);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 20, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {ALERT_OPTIONS.map((alert, index) => {
          const isSelected = selectedAlerts.includes(alert.id);
          const isLastOption = index === ALERT_OPTIONS.length - 1;
          
          return (
            <View key={alert.id}>
              <Pressable
                onPress={() => handleToggleAlert(alert.id)}
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor:
                      isSelected || pressed
                        ? themeColors.background.tertiary()
                        : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${alert.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={alert.icon as any}
                      size={20}
                      color={
                        isSelected
                          ? themeColors.interactive.primary()
                          : themeColors.text.secondary()
                      }
                    />
                  </View>
                  <Text
                    style={[
                      getTextStyle('body-large'),
                      {
                        color: themeColors.text.primary(),
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {alert.label}
                  </Text>
                </View>
              </Pressable>
              {/* dashed separator below each option except the last one - matches button paddingHorizontal (16px) */}
              {!isLastOption && (
                <DashedSeparator paddingHorizontal={16} />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingHorizontal: 0 },
  optionButton: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  optionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: { width: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
