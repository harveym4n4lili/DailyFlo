/**
 * shared layout for `OnboardingQuestionnaireTaskTitleRow` (full-width row + separator band).
 * `taskAgendaSuggestionChipLayoutStyles` is the same surface + checkbox + title in a compact width (no pencil) for sideways-scrolling suggestion chips.
 */

import { StyleSheet } from 'react-native';

import { CHECKBOX_SIZE_DEFAULT } from '@/components/ui/Button';
import { Paddings } from '@/constants/Paddings';

/** horizontal space reserved left of title row — mirrors `checkboxColumn` (box + gap before title) */
export const TASK_AGENDA_TITLE_ROW_CHECKBOX_GAP_WIDTH = CHECKBOX_SIZE_DEFAULT + 12;

/** shared px for task-row pencil + suggestion sparkles (`CHECKBOX_SIZE_DEFAULT`) — single export so they always match */
export const TASK_AGENDA_ROW_ICON_SIZE = CHECKBOX_SIZE_DEFAULT;

export const TASK_AGENDA_TITLE_ROW_PENCIL_ICON_SIZE = TASK_AGENDA_ROW_ICON_SIZE;

/** reserve same width as `pencilWrap` margin + icon so separator row clears the pencil */
export const TASK_AGENDA_TITLE_ROW_PENCIL_SLOT_WIDTH = 12 + TASK_AGENDA_ROW_ICON_SIZE;

export const taskAgendaTitleRowLayoutStyles = StyleSheet.create({
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

/** compact suggestion “chips”: same padding + icon column (sparkles) + title; icon column width matches the task row checkbox for alignment; width follows label (horizontal `ScrollView` row). */
export const taskAgendaSuggestionChipLayoutStyles = StyleSheet.create({
  root: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  surfaceShell: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  surfaceInner: {
    paddingVertical: Paddings.card,
    paddingHorizontal: Paddings.card,
    alignSelf: 'flex-start',
  },
  topBand: {
    flexDirection: 'row',
    // stretch so sparkles column + title column share one height; each column centers its content (matches full task row band)
    alignItems: 'stretch',
    alignSelf: 'flex-start',
  },
  checkboxColumn: {
    width: CHECKBOX_SIZE_DEFAULT,
    marginRight: 12,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    flexShrink: 1,
    justifyContent: 'center',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
});
