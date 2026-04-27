/**
 * Description Component — TaskScreen task creation.
 *
 * Text area for task description/notes.
 *
 * - Multiline text input with character limit
 * - Theme-aware styling, paragraph icon (primary text color)
 * - Icon + content layout pattern inline
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { CustomTextInput } from '@/components/ui/textinput';
import { ParagraphIcon, SFSymbolIcon } from '@/components/ui/icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import type { TaskColor } from '@/types';

// constants for icon + content layout - SF Symbol size 20
const ICON_SIZE = 20;
const ICON_CONTAINER_HEIGHT = 22;
const ICON_TOP_OFFSET = -2;
const ICON_CONTENT_GAP = 8;

export interface DescriptionProps {
  description?: string;
  onDescriptionChange?: (description: string) => void;
  isEditing?: boolean;
  taskColor?: TaskColor;
  onFocus?: () => void;
  onBlur?: () => void;
  /**
   * When true (task create/edit): description uses notes-area padding + minVisibleLines empty height in CustomTextInput.
   * When false (e.g. quick add): compact — one line tall until content grows.
   */
  useInitialMinHeight?: boolean;
  /**
   * only when useInitialMinHeight: minimum logical lines of empty space (default 5 for task view).
   * quick add passes useInitialMinHeight false so this is ignored there.
   */
  minVisibleLines?: number;
  /** when false, hides the paragraph icon but keeps the same left gutter so grouped-list separators still line up */
  showIcon?: boolean;
}

export const Description: React.FC<DescriptionProps> = ({
  description = '',
  onDescriptionChange,
  isEditing = false,
  taskColor = 'blue',
  onFocus,
  onBlur,
  useInitialMinHeight = true,
  minVisibleLines,
  showIcon = true,
}) => {
  const [localDescription, setLocalDescription] = useState(description);
  const themeColors = useThemeColors();

  const handleDescriptionChange = (text: string) => {
    setLocalDescription(text);
    onDescriptionChange?.(text);
  };

  // task screen: at least minVisibleLines (default 5) of empty height inside CustomTextInput; quick add uses compactInitialHeight
  const notesMinLines = useInitialMinHeight ? (minVisibleLines ?? 5) : undefined;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* icon + content layout: icon on left, text input on right */}
        <View style={styles.iconContentRow}>
          <View style={styles.iconWrap}>
            {showIcon ? (
              <SFSymbolIcon
                name="doc.text.fill"
                size={ICON_SIZE}
                color={themeColors.text.primary()}
                fallback={<ParagraphIcon size={ICON_SIZE} color={themeColors.text.primary()} />}
              />
            ) : null}
          </View>
          <View style={styles.content}>
            <CustomTextInput
              value={localDescription}
              onChangeText={handleDescriptionChange}
              placeholder="Description"
              editable={isEditing}
              maxLength={500}
              taskColor={taskColor}
              multiline={true}
              compactInitialHeight={!useInitialMinHeight}
              minimumLineCount={notesMinLines}
              containerStyle={styles.textInputContainer}
              inputStyle={styles.descriptionInputPadding}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // height comes from CustomTextInput (minVisibleLines when useInitialMinHeight) — no fixed 120pt box
  wrapper: {
    minHeight: 0,
    alignSelf: 'stretch',
  },
  container: {
    paddingHorizontal: Paddings.none,
    paddingTop: Paddings.none,
    paddingBottom: Paddings.none,
  },
  // icon + content row layout: icon on left, content on right
  iconContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // icon wrapper: fixed width, centered icon
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_CONTAINER_HEIGHT,
    marginTop: ICON_TOP_OFFSET,
    marginRight: ICON_CONTENT_GAP,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // content area: flex to fill available space
  content: {
    flex: 1,
    minWidth: 0,
  },
  textInputContainer: {
    flex: 1,
    minWidth: 0,
  },
  // override CustomTextInput's default paddingVertical (12) to remove extra top/bottom space
  descriptionInputPadding: {
    paddingTop: Paddings.none,
    paddingBottom: Paddings.none,
    paddingLeft: Paddings.none,
  },
});

export default Description;
