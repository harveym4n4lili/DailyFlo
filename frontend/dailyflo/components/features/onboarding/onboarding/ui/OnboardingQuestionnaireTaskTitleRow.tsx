/**
 * onboarding “what’s on the agenda?” row — top band: checkbox vertically centered with title + pencil; second band: solid rule only under the title column (spacers mimic checkbox + pencil widths so the line never sits beneath the pencil).
 * surface uses `primarySecondaryBlend()` + radius + equal vertical inset (`Paddings.card`).
 * state still flows from `OnboardingQuestionnaireFlow` via props (no task entity / redux here).
 */

import React from 'react';
import { DynamicColorIOS, Platform, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Checkbox, CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { SolidSeparator } from '@/components/ui/borders';
import { PencilIcon } from '@/components/ui/Icon';
import { Paddings } from '@/constants/Paddings';
import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';

import { ONBOARDING_TASK_TITLE_SURFACE_RADIUS } from '../constants/pagerLayout';

/** horizontal space reserved left of title row — mirrors `checkboxColumn` (box + gap before title) */
const TASK_ROW_CHECKBOX_GAP_WIDTH = CHECKBOX_SIZE_DEFAULT + 12;

const PENCIL_ICON_SIZE = 22;

/** reserve same width as `pencilWrap` margin + icon so separator row clears the pencil */
const TASK_ROW_PENCIL_SLOT_WIDTH = 12 + PENCIL_ICON_SIZE;

export type OnboardingQuestionnaireTaskTitleRowProps = {
  title: string;
  onTitleChange: (next: string) => void;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
};

export function OnboardingQuestionnaireTaskTitleRow({
  title,
  onTitleChange,
  checked,
  onCheckedChange,
}: OnboardingQuestionnaireTaskTitleRowProps) {
  const themeColors = useThemeColors();
  const typography = useTypography();

  const primaryTint = themeColors.primaryButton.fill();
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
    <View style={styles.root}>
      <View
        style={[
          styles.surfaceShell,
          {
            backgroundColor: themeColors.background.primarySecondaryBlend(),
            borderRadius: ONBOARDING_TASK_TITLE_SURFACE_RADIUS,
          },
        ]}
      >
        <View style={styles.surfaceInner}>
          {/* band 1 — checkbox centered with input + pencil only (separator is separate band) */}
          <View style={styles.topBand}>
            <View style={styles.checkboxColumn}>
              <Checkbox
                checked={checked}
                expandTapArea
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onCheckedChange(!checked);
                }}
              />
            </View>

            <View style={styles.titleAndPencilRow}>
              <View style={[styles.titleInputGrow, titleTintWrapperStyle]}>
                <TextInput
                  value={title}
                  onChangeText={onTitleChange}
                  placeholder="Create a task"
                  placeholderTextColor={themeColors.text.tertiary()}
                  selectionColor={primaryTint}
                  cursorColor={primaryTint}
                  underlineColorAndroid="transparent"
                  style={[
                    typography.getTextStyle('heading-4'),
                    styles.titleInput,
                    {
                      color: themeColors.text.primary(),
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
              <View style={styles.pencilWrap} accessibilityElementsHidden>
                <PencilIcon size={PENCIL_ICON_SIZE} color={themeColors.text.tertiary()} />
              </View>
            </View>
          </View>

          {/* band 2 — rule width = title column only (same horizontal gutters as band 1) */}
          <View style={styles.separatorBand}>
            <View style={{ width: TASK_ROW_CHECKBOX_GAP_WIDTH }} />
            <View style={styles.separatorUnderTitle}>
              <SolidSeparator
                paddingLeft={0}
                paddingRight={0}
                color={themeColors.background.secondary()}
              />
            </View>
            <View style={{ width: TASK_ROW_PENCIL_SLOT_WIDTH }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignItems: 'stretch',
  },
  surfaceShell: {
    width: '100%',
    overflow: 'hidden',
  },
  surfaceInner: {
    width: '100%',
    paddingVertical: Paddings.card,
    paddingHorizontal: Paddings.card,
  },
  topBand: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  checkboxColumn: {
    width: CHECKBOX_SIZE_DEFAULT,
    marginRight: 12,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleAndPencilRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  titleInputGrow: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  pencilWrap: {
    marginLeft: 12,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  separatorBand: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: Paddings.touchTarget,
  },
  separatorUnderTitle: {
    flex: 1,
    minWidth: 0,
  },
  titleInput: {
    paddingTop: Paddings.none,
    paddingBottom: Paddings.none,
    paddingHorizontal: Paddings.none,
    marginVertical: Paddings.none,
  },
});
