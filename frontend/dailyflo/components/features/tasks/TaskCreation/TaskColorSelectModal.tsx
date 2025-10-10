/**
 * TaskColorSelectModal
 * 
 * Modal for selecting task color from available color palette.
 * Shows a horizontal scrollable row of color options using TaskCategoryColors from the design system.
 * Uses DraggableModal component for drag-to-dismiss and snap point functionality.
 */

import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalHeader, DraggableModal } from '@/components/layout/ModalLayout';

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
  // flow: user taps a color → this function updates the form state
  // modal stays open so user can continue browsing colors or dismiss manually
  const handleColorSelect = (color: TaskColor) => {
    console.log('Color selected:', color);
    onSelectColor(color);
  };

  return (
    <DraggableModal
      visible={visible}
      onClose={onClose}
      // snap points: close at 30%, initial at 50%, expanded at 93%
      // lowest snap point (30%) will dismiss the modal
      snapPoints={[0.3, 0.5, 0.93]}
      // start at the middle snap point (50%)
      initialSnapPoint={1}
      borderRadius={20}
    >
              {/* modal header with drag indicator and title */}
              {/* showDragIndicator displays the small rounded bar at the top */}
              {/* showCloseButton is false since we dismiss by dragging or tapping backdrop */}
              <ModalHeader
                title="Color"
                showCloseButton={false}
                showDragIndicator={true}
                showBorder={true}
              />

              {/* scrollable content area */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingTop: 12,
                  paddingBottom: insets.bottom + 24,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* horizontal color slider */}
                <View
                  style={{
                    width: '100%',
                  }}
                >
                {/* container with same styling as the color icon button */}
                <View
                  style={{
                    backgroundColor: themeColors.background.tertiary(),
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    width: '100%',
                    alignItems: 'center',
                    borderRadius: 29,
                  }}
                >
                  {/* horizontal scrollable row of color circles */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      gap: 16,
                      alignItems: 'center',
                      borderRadius: 29,
                    }}
                  >
                  {/* map through available colors and display them as circular swatches */}
                  {AVAILABLE_COLORS.map((color) => {
                    // check if this color is currently selected
                    const isSelected = color === selectedColor;
                    
                    // get the color value from our color palette system
                    // using shade 500 for the main color display
                    const colorValue = TaskCategoryColors[color][500];

                    return (
                      <Pressable
                        key={color}
                        onPress={() => handleColorSelect(color)}
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {/* color circle swatch */}
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 25,
                            backgroundColor: colorValue,
                            borderWidth: isSelected ? 2 : 0,
                            borderColor: themeColors.border.invertedPrimary(),
                          }}
                        />
                      </Pressable>
                    );
                  })}
                  </ScrollView>
                </View>
                </View>
              </ScrollView>
    </DraggableModal>
  );
}

export default TaskColorSelectModal;

