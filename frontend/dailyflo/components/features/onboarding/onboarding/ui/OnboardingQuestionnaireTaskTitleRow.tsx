/**
 * onboarding “what’s on the agenda?” row — top band: checkbox vertically centered with title + pencil; second band: solid rule only under the title column (spacers mimic checkbox + pencil widths so the line never sits beneath the pencil).
 * surface uses `primarySecondaryBlend()` + radius + equal vertical inset (`Paddings.card`); no outer ring — suggestion chips keep the stroke.
 * layout tokens live in `taskAgendaTitleRowLayout.ts` so suggestion chips share icon-column width with this row’s checkbox (chips show sparkles instead).
 * state still flows from `OnboardingQuestionnaireFlow` via props (no task entity / redux here).
 */

import React from 'react';
import { DynamicColorIOS, Platform, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Checkbox } from '@/components/ui/Button';
import { SolidSeparator } from '@/components/ui/borders';
import { PencilFillIcon } from '@/components/ui/Icon';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

import { ONBOARDING_TASK_TITLE_SURFACE_RADIUS } from '../constants/pagerLayout';
import {
  TASK_AGENDA_TITLE_ROW_CHECKBOX_GAP_WIDTH,
  TASK_AGENDA_TITLE_ROW_PENCIL_ICON_SIZE,
  TASK_AGENDA_TITLE_ROW_PENCIL_SLOT_WIDTH,
  taskAgendaTitleRowLayoutStyles as L,
} from './taskAgendaTitleRowLayout';

export type OnboardingQuestionnaireTaskTitleRowProps = {
  title: string;
  onTitleChange: (next: string) => void;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  /** when set, `TextInput` uses slide `taskAgendaBody.taskTitleInput` (or `titleColor`) blended with questionnaire progress */
  titleInputColor?: string;
  /** when set (task agenda + slide-blended chrome), tints the edit pencil with the step’s `captionColor` ramp */
  pencilIconColor?: string;
  /** when true, title stays read-only so taps don’t focus / open the keyboard (checkbox still works) */
  suppressTitleKeyboard?: boolean;
};

export function OnboardingQuestionnaireTaskTitleRow({
  title,
  onTitleChange,
  checked,
  onCheckedChange,
  titleInputColor,
  pencilIconColor,
  suppressTitleKeyboard = false,
}: OnboardingQuestionnaireTaskTitleRowProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const primaryTint = themeColors.primaryButton.fill();
  const pencilColor = pencilIconColor ?? themeColors.text.tertiary();
  const inputTextColor = titleInputColor ?? themeColors.text.primary();
  // ios: tint drives caret — no alignSelf stretch here; parent row uses stretch + justifyContent center so glyphs line up with checkbox + pencil
  const titleTintWrapperStyle =
    Platform.OS === 'ios'
      ? ({
          tintColor: DynamicColorIOS({
            light: primaryTint,
            dark: primaryTint,
          }),
        } as object)
      : {};

  return (
    <View style={L.root}>
      <View
        style={[
          L.surfaceShell,
          {
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderRadius: ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
          },
        ]}
      >
        <View style={L.surfaceInner}>
          {/* band 1 — checkbox centered with input + pencil only (separator is separate band) */}
          <View style={L.topBand}>
            <View style={L.checkboxColumn}>
              <Checkbox
                checked={checked}
                expandTapArea
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCheckedChange(!checked);
                }}
              />
            </View>

            <View style={L.titleAndPencilRow}>
              <View style={[L.titleInputGrow, titleTintWrapperStyle]}>
                <TextInput
                  value={title}
                  onChangeText={onTitleChange}
                  editable={!suppressTitleKeyboard}
                  placeholder="Create a task"
                  placeholderTextColor={themeColors.text.tertiary()}
                  selectionColor={primaryTint}
                  cursorColor={primaryTint}
                  underlineColorAndroid="transparent"
                  style={[
                    typography.getTextStyle('heading-4'),
                    L.titleInput,
                    {
                      color: inputTextColor,
                      ...(Platform.OS === 'android'
                        ? {
                            textAlignVertical: 'center',
                            includeFontPadding: false,
                          }
                        : {}),
                      // @ts-expect-error caretColor valid on RN `TextInput`
                      caretColor: primaryTint,
                    },
                  ]}
                  returnKeyType="done"
                  accessibilityLabel="Task title field"
                />
              </View>
              <View style={L.pencilWrap} accessibilityElementsHidden>
                <PencilFillIcon size={TASK_AGENDA_TITLE_ROW_PENCIL_ICON_SIZE} color={pencilColor} />
              </View>
            </View>
          </View>

          {/* band 2 — rule width = title column only (same horizontal gutters as band 1) */}
          <View style={L.separatorBand}>
            <View style={{ width: TASK_AGENDA_TITLE_ROW_CHECKBOX_GAP_WIDTH }} />
            <View style={L.separatorUnderTitle}>
              <SolidSeparator
                paddingLeft={0}
                paddingRight={0}
                color={themeColors.background.secondary()}
              />
            </View>
            <View style={{ width: TASK_AGENDA_TITLE_ROW_PENCIL_SLOT_WIDTH }} />
          </View>
        </View>
      </View>
    </View>
  );
}
