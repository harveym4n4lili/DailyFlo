/**
 * MainTaskEditModal Component
 * 
 * A draggable modal for editing task title, icon, and description.
 * Opens over the TaskViewModal when user taps on the title + icon + desc section.
 * 
 * Features:
 * - Draggable modal with slide-up animation
 * - Title input field
 * - Description input field
 * - Icon picker button (only icon selection, no date/time/alerts)
 * - Same styling as TaskCreation modal
 * - MainCloseButton for closing
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

// LAYOUT COMPONENTS IMPORTS
import { DraggableModal } from '@/components/layout/ModalLayout';

// UI COMPONENTS IMPORTS
import { MainCloseButton } from '@/components/ui/Button/CloseButton/MainCloseButton';
import { FormPickerButton } from '@/components/ui/Button/FormPickerButton/FormPickerButton';
import { getIconPickerDisplay } from '@/components/ui/Button';

// FEATURE COMPONENTS IMPORTS
import { DescriptionSection } from '@/components/features/tasks/TaskCreation/sections';
import { IconColorModal } from '@/components/features/tasks/TaskCreation/modals';

// CUSTOM HOOKS IMPORTS
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { getTextStyle } from '@/constants/Typography';
import { TaskCategoryColors } from '@/constants/ColorPalette';

// TYPES IMPORTS
import type { TaskColor, Task } from '@/types';

export interface MainTaskEditModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Task data to edit */
  task?: Task;
  
  /** Callback when task is updated */
  onUpdate?: (updates: { title?: string; description?: string; icon?: string; color?: TaskColor }) => void;
}

/**
 * MainTaskEditModal Component
 * 
 * Renders a draggable modal for editing task title, icon, and description.
 */
export const MainTaskEditModal: React.FC<MainTaskEditModalProps> = ({
  visible,
  onClose,
  task,
  onUpdate,
}) => {
  // HOOKS
  const colors = useColorPalette();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // STATE
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [icon, setIcon] = useState(task?.icon || undefined);
  const [color, setColor] = useState<TaskColor>(task?.color || 'blue');
  const [isIconColorPickerVisible, setIsIconColorPickerVisible] = useState(false);

  // Update state when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setIcon(task.icon || undefined);
      setColor(task.color || 'blue');
    }
  }, [task]);

  // Handle icon/color picker close
  const handleIconColorPickerClose = () => {
    setIsIconColorPickerVisible(false);
  };

  // Handle icon selection (IconColorModal uses separate callbacks)
  const handleIconSelect = (iconName: string) => {
    setIcon(iconName);
    if (onUpdate) {
      onUpdate({ icon: iconName });
    }
  };
  
  // Handle color selection (IconColorModal uses separate callbacks)
  const handleColorSelect = (selectedColor: TaskColor) => {
    setColor(selectedColor);
    if (onUpdate) {
      onUpdate({ color: selectedColor });
    }
  };

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (onUpdate) {
      onUpdate({ title: newTitle });
    }
  };

  // Handle description change
  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    if (onUpdate) {
      onUpdate({ description: newDescription });
    }
  };

  // Get icon picker display info
  const iconDisplayInfo = getIconPickerDisplay(icon, color, colors, themeColors);

  return (
    <>
      <DraggableModal
        visible={visible}
        onClose={onClose}
        snapPoints={[0.95]} // Single snap point at 95% of screen height
        initialSnapPoint={0}
        borderRadius={12}
        zIndex={10002} // Higher than TaskViewModal (10001) for proper layering
        showBackdrop={true}
        backgroundColor={themeColors.background.primary()}
      >
        <View style={{ flex: 1 }}>
          {/* Close button */}
          <MainCloseButton
            onPress={onClose}
            color={color}
          />

          {/* Main scrollable content */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{ paddingBottom: 0 }}
          >
            {/* Title input section */}
            <View
              style={{
                paddingTop: 80 + insets.top,
                paddingBottom: 0,
                paddingHorizontal: 20,
              }}
            >
              <TextInput
                value={title}
                onChangeText={handleTitleChange}
                placeholder="e.g., Answering emails"
                placeholderTextColor={themeColors.text.tertiary()}
                selectionColor={TaskCategoryColors[color][500]}
                style={{
                  ...getTextStyle('heading-2'),
                  color: themeColors.text.primary(),
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                }}
                autoFocus={true}
                returnKeyType="next"
              />
            </View>

            {/* Description section */}
            <View style={{ paddingTop: 8 }}>
              <DescriptionSection
                description={description}
                onDescriptionChange={handleDescriptionChange}
                isEditing={true}
                taskColor={color}
              />
            </View>

            {/* Icon picker button section */}
            <View style={{ paddingTop: 16, paddingBottom: 8, paddingHorizontal: 20 }}>
              <FormPickerButton
                icon={iconDisplayInfo.icon}
                label={iconDisplayInfo.label}
                onPress={() => setIsIconColorPickerVisible(true)}
                taskColor={color}
              />
            </View>
          </ScrollView>
        </View>
      </DraggableModal>

      {/* Icon/Color picker modal */}
      <IconColorModal
        visible={isIconColorPickerVisible}
        onClose={handleIconColorPickerClose}
        selectedIcon={icon}
        selectedColor={color}
        onSelectIcon={handleIconSelect}
        onSelectColor={handleColorSelect}
        taskCategoryColor={color}
      />
    </>
  );
};

export default MainTaskEditModal;

