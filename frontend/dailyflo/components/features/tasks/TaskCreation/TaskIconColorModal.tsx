/**
 * TaskIconColorModal
 * 
 * Modal for selecting task icon and color.
 * Shows color selection at the top and icon selection grid below.
 * Uses DraggableModal component for drag-to-dismiss and snap point functionality.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalHeader, DraggableModal } from '@/components/layout/ModalLayout';

export interface TaskIconColorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: TaskColor;
  onSelectColor: (color: TaskColor) => void;
  selectedIcon?: string;
  onSelectIcon?: (icon: string) => void;
}

// available task colors that match our color palette system
const AVAILABLE_COLORS: TaskColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange'];

// available icons for tasks (using Ionicons names)
// these are common task-related icons that users can choose from
const AVAILABLE_ICONS = [
  { name: 'briefcase-outline', label: 'Work' },
  { name: 'home-outline', label: 'Home' },
  { name: 'cart-outline', label: 'Shopping' },
  { name: 'fitness-outline', label: 'Fitness' },
  { name: 'restaurant-outline', label: 'Food' },
  { name: 'car-outline', label: 'Travel' },
  { name: 'book-outline', label: 'Reading' },
  { name: 'code-slash-outline', label: 'Code' },
  { name: 'call-outline', label: 'Call' },
  { name: 'mail-outline', label: 'Email' },
  { name: 'people-outline', label: 'Meeting' },
  { name: 'musical-notes-outline', label: 'Music' },
  { name: 'medkit-outline', label: 'Health' },
  { name: 'school-outline', label: 'Study' },
  { name: 'cash-outline', label: 'Finance' },
  { name: 'gift-outline', label: 'Gift' },
];

export function TaskIconColorModal({
  visible,
  onClose,
  selectedColor,
  onSelectColor,
  selectedIcon,
  onSelectIcon,
}: TaskIconColorModalProps) {
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

  // handle icon selection
  // flow: user taps an icon → this function updates the form state
  // modal stays open so user can continue browsing or dismiss manually
  const handleIconSelect = (iconName: string) => {
    console.log('Icon selected:', iconName);
    onSelectIcon?.(iconName);
  };

  return (
    <DraggableModal
      visible={visible}
      onClose={onClose}
      // snap points: close at 30%, initial at 60%, expanded at 93%
      // lowest snap point (30%) will dismiss the modal
      snapPoints={[0.3, 0.6, 0.93]}
      // start at the middle snap point (60%)
      initialSnapPoint={1}
      borderRadius={20}
    >
              {/* modal header with drag indicator and title */}
              {/* showDragIndicator displays the small rounded bar at the top */}
              {/* showCloseButton is false since we dismiss by dragging or tapping backdrop */}
              <ModalHeader
                title="Icon & Color"
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
                  gap: 24,
                }}
                showsVerticalScrollIndicator={false}
              >

               {/* color selection section */}
               <View style={{ gap: 12 }}>
                  <Text style={[
                    getTextStyle('body-large'),
                    { color: themeColors.text.primary(), fontWeight: '600' }
                  ]}>
                    Color
                  </Text>
                  
                  {/* horizontal color slider */}
                  <View
                    style={{
                      backgroundColor: themeColors.background.tertiary(),
                      paddingVertical: 8,
                      paddingHorizontal: 8,
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

                {/* icon selection section */}
                <View style={{ gap: 12 }}>
                  <Text style={[
                    getTextStyle('body-large'),
                    { color: themeColors.text.primary(), fontWeight: '600' }
                  ]}>
                    Icon
                  </Text>
                  
                  {/* grid of icon options */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    {AVAILABLE_ICONS.map((icon) => {
                      // check if this icon is currently selected
                      const isSelected = icon.name === selectedIcon;
                      
                      return (
                        <Pressable
                          key={icon.name}
                          onPress={() => handleIconSelect(icon.name)}
                          style={{
                            width: 72,
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {/* icon circle */}
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              backgroundColor: isSelected 
                                ? TaskCategoryColors[selectedColor][500]
                                : themeColors.background.tertiary(),
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: isSelected ? 2 : 0,
                              borderColor: themeColors.border.invertedPrimary(),
                            }}
                          >
                            <Ionicons
                              name={icon.name as any}
                              size={24}
                              color={isSelected ? '#FFFFFF' : themeColors.text.primary()}
                            />
                          </View>
                          
                          {/* icon label */}
                          <Text
                            style={[
                              getTextStyle('body-small'),
                              {
                                color: isSelected 
                                  ? themeColors.text.primary()
                                  : themeColors.text.secondary(),
                                textAlign: 'center',
                              }
                            ]}
                            numberOfLines={1}
                          >
                            {icon.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

              </ScrollView>
    </DraggableModal>
  );
}

export default TaskIconColorModal;

