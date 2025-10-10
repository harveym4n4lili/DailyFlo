/**
 * TaskColorSelectModal
 * 
 * Modal for selecting task color from available color palette.
 * Shows a grid of color options using TaskCategoryColors from the design system.
 */

import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalContainer } from '@/components/layout/ModalLayout';

export interface TaskColorSelectModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: TaskColor;
  onSelectColor: (color: TaskColor) => void;
}

// available task colors that match our color palette system
const AVAILABLE_COLORS: TaskColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange'];

// color display names for better UX
const COLOR_NAMES: Record<TaskColor, string> = {
  red: 'Red',
  blue: 'Blue',
  green: 'Green',
  yellow: 'Yellow',
  purple: 'Purple',
  teal: 'Teal',
  orange: 'Orange',
};

export function TaskColorSelectModal({
  visible,
  onClose,
  selectedColor,
  onSelectColor,
}: TaskColorSelectModalProps) {
  // get theme-aware colors from the color palette system
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  // handle color selection
  // flow: user taps a color → this function updates the form state → modal closes
  const handleColorSelect = (color: TaskColor) => {
    console.log('Color selected:', color);
    onSelectColor(color);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      transparent={false}
    >
      <ModalContainer
        presentationStyle="pageSheetWithHeight"
        height={480}
        onClose={onClose}
        noPadding={false}
      >
        {/* modal header */}
        <View
          style={{
            paddingTop: 12,
            paddingBottom: 20,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: themeColors.border.primary(),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text
              style={{
                ...getTextStyle('heading-3'),
                color: themeColors.text.primary(),
              }}
            >
              Task Color
            </Text>
            
            {/* close button */}
            <Pressable
              onPress={onClose}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: themeColors.interactive.tertiary(),
              }}
            >
              <Ionicons
                name="close"
                size={24}
                color={themeColors.text.secondary()}
              />
            </Pressable>
          </View>
        </View>

        {/* color grid */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* map through available colors and display them in a grid-like layout */}
          {AVAILABLE_COLORS.map((color) => {
            // check if this color is currently selected
            const isSelected = color === selectedColor;
            
            // get the color value from our color palette system
            // using shade 500 for the main color display
            const colorValue = TaskCategoryColors[color][500];
            
            // get a lighter shade for the background
            const bgColorValue = TaskCategoryColors[color][50];

            return (
              <Pressable
                key={color}
                onPress={() => handleColorSelect(color)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: isSelected 
                    ? bgColorValue 
                    : themeColors.background.elevated(),
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected 
                    ? colorValue 
                    : themeColors.border.primary(),
                }}
              >
                {/* left side: color circle and name */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  {/* color circle preview */}
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colorValue,
                      borderWidth: 2,
                      borderColor: themeColors.border.secondary(),
                    }}
                  />
                  
                  {/* color name */}
                  <Text
                    style={{
                      ...getTextStyle('body-large'),
                      color: themeColors.text.primary(),
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {COLOR_NAMES[color]}
                  </Text>
                </View>

                {/* right side: checkmark if selected */}
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colorValue}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </ModalContainer>
    </Modal>
  );
}

export default TaskColorSelectModal;

