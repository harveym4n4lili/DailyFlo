/**
 * ios — liquid glass segmented picker (LIQUID_GLASS_DAY_PICKER.md):
 * View (layout) → GlassView → Host (matchContents, h=31) → Picker (segmented).
 * system segment styling inside the glass shell; no custom segment fills.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import GlassView from 'expo-glass-effect/build/GlassView';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import type { LiquidGlassSegmentedPickerProps } from './liquidGlassSegmentedPickerTypes';

const PICKER_HOST_HEIGHT = 31;
const GLASS_BAR_HEIGHT = 32;

export function LiquidGlassSegmentedPicker<T extends string>({
  options,
  value,
  onValueChange,
}: LiquidGlassSegmentedPickerProps<T>) {
  const themeColors = useThemeColors();
  const shellColor = '#000000';

  return (
    <View style={styles.layoutWrap}>
      <GlassView
        style={[styles.glassShell, { backgroundColor: shellColor }]}
        glassEffectStyle="clear"
        tintColor={shellColor as any}
        isInteractive={false}
      >
        <Host matchContents style={styles.host}>
          <Picker
            modifiers={[pickerStyle('segmented')]}
            selection={value}
            onSelectionChange={(selection) => {
              onValueChange(selection as T);
            }}
          >
            {options.map((option) => (
              <Text key={option.value} modifiers={[tag(option.value)]}>
                {option.label}
              </Text>
            ))}
          </Picker>
        </Host>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutWrap: {
    alignSelf: 'stretch',
    marginHorizontal: -Paddings.liquidGlassBleed,
    paddingHorizontal: Paddings.liquidGlassBleed,
    overflow: 'visible',
  },
  glassShell: {
    height: GLASS_BAR_HEIGHT,
    borderRadius: Paddings.formDataPillRadius,
    overflow: 'hidden',

  },
  host: {
    height: PICKER_HOST_HEIGHT,
    alignSelf: 'stretch',
  },
});
