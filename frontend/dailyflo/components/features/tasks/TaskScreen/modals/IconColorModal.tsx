/**
 * IconColorModal
 * 
 * Modal for selecting task icon and color.
 * Shows color selection at the top and icon selection grid below.
 * Uses DraggableModal component for drag-to-dismiss and snap point functionality.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { Paddings } from '@/constants/Paddings';
import { TaskCategoryColors } from '@/constants/ColorPalette';
import type { TaskColor } from '@/types';
import { ModalHeader, DraggableModal, LockableScrollView } from '@/components/layout/ModalLayout';

export interface IconColorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedColor: TaskColor;
  onSelectColor: (color: TaskColor) => void;
  selectedIcon?: string;
  onSelectIcon?: (icon: string) => void;
  taskCategoryColor?: TaskColor;
}

// available task colors that match our color palette system
const AVAILABLE_COLORS: TaskColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'teal', 'orange'];

// icon grid configuration
const ICON_PADDING = 4; // padding around each icon - adjust this to control spacing
const ICONS_PER_ROW = 6; // number of icons per row

// available icons for tasks (using Ionicons names)
// these are common task-related icons that users can choose from
// using filled/solid variants for thicker stroke appearance
const AVAILABLE_ICONS = [
  { name: 'briefcase', label: 'Work' },
  { name: 'home', label: 'Home' },
  { name: 'cart', label: 'Shopping' },
  { name: 'fitness', label: 'Fitness' },
  { name: 'restaurant', label: 'Food' },
  { name: 'car', label: 'Travel' },
  { name: 'book', label: 'Reading' },
  { name: 'code-slash', label: 'Code' },
  { name: 'call', label: 'Call' },
  { name: 'mail', label: 'Email' },
  { name: 'people', label: 'Meeting' },
  { name: 'musical-notes', label: 'Music' },
  { name: 'medkit', label: 'Health' },
  { name: 'school', label: 'Study' },
  { name: 'cash', label: 'Finance' },
  { name: 'gift', label: 'Gift' },
  { name: 'calendar', label: 'Event' },
  { name: 'time', label: 'Clock' },
  { name: 'airplane', label: 'Flight' },
  { name: 'camera', label: 'Photo' },
  { name: 'heart', label: 'Heart' },
  { name: 'star', label: 'Star' },
  { name: 'trophy', label: 'Goal' },
  { name: 'bed', label: 'Sleep' },
  { name: 'pizza', label: 'Pizza' },
  { name: 'beer', label: 'Drink' },
  { name: 'bicycle', label: 'Bike' },
  { name: 'game-controller', label: 'Game' },
  { name: 'tv', label: 'Watch' },
  { name: 'laptop', label: 'Laptop' },
  { name: 'phone-portrait', label: 'Phone' },
  { name: 'cut', label: 'Haircut' },
  { name: 'paw', label: 'Pet' },
  { name: 'leaf', label: 'Nature' },
  { name: 'bulb', label: 'Idea' },
  { name: 'build', label: 'Fix' },
  { name: 'hammer', label: 'DIY' },
  { name: 'brush', label: 'Art' },
  { name: 'chatbubble', label: 'Chat' },
  { name: 'document-text', label: 'Doc' },
];

export function IconColorModal({
  visible,
  onClose,
  selectedColor,
  onSelectColor,
  selectedIcon,
  onSelectIcon,
  taskCategoryColor,
}: IconColorModalProps) {
  // CONSOLE DEBUGGING
  // console.log('🎨 IconColorModal - visible:', visible);
  
  // get theme-aware colors from the color palette system
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();

  // changes are now applied instantly - no temporary state needed

  // handle color selection
  // flow: user taps a color → apply color immediately
  // changes are applied instantly - no save button needed
  const handleColorSelect = (color: TaskColor) => {
    // console.log('Color selected:', color);
    onSelectColor(color); // apply color immediately
  };

  // handle icon selection
  // flow: user taps an icon → apply icon immediately
  // changes are applied instantly - no save button needed
  const handleIconSelect = (iconName: string) => {
    // console.log('Icon selected:', iconName);
    onSelectIcon?.(iconName); // apply icon immediately
  };

  return (
    <>
      <DraggableModal
        visible={visible}
        onClose={onClose}
        // snap points: close at 30%, initial at 60%, expanded at 93%
        // lowest snap point (30%) will dismiss the modal
        snapPoints={[0.3, 0.5, 0.9]}
        // start at the middle snap point (60%)
        initialSnapPoint={1}
        // showBackdrop=true: DraggableModal handles its own backdrop
        showBackdrop={true}
        // sticky header that moves with modal drag but floats over scrolling content
        stickyHeader={
          // color slider positioned absolutely to float over icon grid
          <View
            style={{
              position: 'absolute',
              top: 76, // position below the header
              left: 0,
              right: 0,
              zIndex: 10, // ensure it floats above scrolling content
              paddingHorizontal: Paddings.groupedListContentHorizontal,
            }}
          >
            <View>
              {/* horizontal color slider */}
              <View
                style={{
                  backgroundColor: themeColors.background.quaternary(),
                  paddingVertical: Paddings.touchTarget,
                  paddingHorizontal: Paddings.touchTarget,
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
          </View>
        }
      >
              {/* modal header with action buttons */}
              {/* no action buttons needed - changes apply instantly */}
              <ModalHeader
                title="Icon & Color"
                showActionButtons={false}
                showCloseButton={true}
                onClose={onClose}
                showDragIndicator={true}
                showBorder={true}
                taskCategoryColor={taskCategoryColor}
              />

              {/* scrollable icon grid area */}
              {/* LockableScrollView automatically locks scrolling when modal is not at top anchor */}
              <LockableScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingTop: Paddings.iconColorModalContentTop,
                  paddingBottom: insets.bottom + Paddings.modalBottomExtra,
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* icon selection section */}
                <View style={{ gap: 12 }}>
                  <Text style={[
                    getTextStyle('heading-4'),
                    { color: themeColors.text.primary(), paddingHorizontal: Paddings.groupedListContentHorizontal }
                  ]}>
                    Icon
                  </Text>
                  
                  {/* grid of icon options - 6 icons per row with equal padding */}
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      paddingHorizontal: Paddings.touchTarget,
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
                            width: `${100 / ICONS_PER_ROW}%`, // dynamically calculate width based on icons per row
                            padding: ICON_PADDING, // equal padding on all sides - change ICON_PADDING constant to adjust
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                            {/* icon circle */}
                            <View
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: isSelected 
                                  ? themeColors.background.invertedSecondary()
                                  : themeColors.background.tertiary(),
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Ionicons
                                name={icon.name as any}
                                size={24}
                                color={isSelected ? themeColors.interactive.invertedPrimary() : themeColors.interactive.primary()}
                           
                              />
                            </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>


              </LockableScrollView>
    </DraggableModal>
    </>
  );
}

export default IconColorModal;

