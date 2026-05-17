/**

 * questionnaire funnel — titles/captions per slide (merged onto typography.ts headline styles).

 */



import type { TextStyle } from 'react-native';



import { FontWeight } from '@/constants/Typography';



import type { OnboardingSlidesPageTitleConfig } from './types';



const ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE: TextStyle = {

  fontWeight: FontWeight.bold,

};



/** intro + wake + sleep + pick habit/task — branch-specific slides append after this block */

export const ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT = 4;



export const ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [

  {

    title: 'Start planning your day...',

    highlight: {

      text: 'planning',

      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,

    },

  },

  {

    title: 'What time do you wake up?',

    highlight: {

      text: 'wake up',

      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,

    },

  },

  {

    title: 'When do you go to sleep?',

    highlight: {

      text: 'go to sleep?',

      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,

    },

  },

  {

    title: 'Pick your next step.',

    highlight: {

      text: 'habit',

      style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE,

    },

  },

];



export const ONBOARDING_QUESTIONNAIRE_CORE_PAGE_CAPTIONS: readonly string[] = [

  'Just a few steps to get you started.',

  "DailyFlo will anchor your timeline around your mornings.",

  'Having a sleep schedule helps your body and mind.',

  '',

];



/** shown after “plan a task” — order matches `ONBOARDING_QUESTIONNAIRE_TASK_BRANCH_SLIDE_UI` */

export const ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [

  {

    title: "What's on the agenda?",

    highlight: { text: 'agenda', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

  {

    title: 'At what time?',

    highlight: { text: 'time', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

  {

    title: 'For how long?',

    highlight: { text: 'long', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

  {

    title: 'Great, your task is in flow.',

    highlight: { text: 'flow', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

];



export const ONBOARDING_QUESTIONNAIRE_TASK_FOLLOWUP_CAPTIONS: readonly string[] = [
  'Name a goal you want to achieve today.',
  'Choose when this task sits on your timeline.',
  'Slide to set how long you want to spend on this task.',
  'Wake and sleep frame your day — here is your task on the timeline.',
];



/** shown after “build a habit” — order matches `ONBOARDING_QUESTIONNAIRE_HABIT_BRANCH_SLIDE_UI` */

export const ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_TITLES: readonly OnboardingSlidesPageTitleConfig[] = [

  {

    title: 'What is our goal?',

    highlight: { text: 'goal', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

  {

    title: 'How often?',

    highlight: { text: 'often', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

  {

    title: "Nice! That's a great plan.",

    highlight: { text: 'plan', style: ONBOARDING_SLIDES_PAGE_TITLE_HIGHLIGHT_STYLE },

  },

];



export const ONBOARDING_QUESTIONNAIRE_HABIT_FOLLOWUP_CAPTIONS: readonly string[] = ['', '', ''];



/** bottom CTA — intermediate questionnaire steps */
export const ONBOARDING_SLIDES_CONTINUE_LABEL = 'Continue';

/** last questionnaire step — primary label before exiting onboarding */
export const ONBOARDING_SLIDES_FINISH_SETUP_LABEL = 'Finish Setup';

/** re-export — canonical copy lives in `slideUiTokens.ts` with `taskAgendaBody` */
export {
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE,
  ONBOARDING_TASK_AGENDA_SUGGESTION_PILLS,
} from './slideUiTokens';

/** wake question slide — index inside `ONBOARDING_QUESTIONNAIRE_CORE_PAGE_TITLES` */

export const ONBOARDING_QUESTIONNAIRE_WAKE_STEP_INDEX = 1;

/** sleep question slide */

export const ONBOARDING_QUESTIONNAIRE_SLEEP_STEP_INDEX = 2;



/** habit vs task picker — last index of the fixed core (branch slides start at index + 1) */

export const ONBOARDING_QUESTIONNAIRE_NEXT_STEP_SLIDE_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT - 1;

/** task branch — “what’s on the agenda?” (keyboard + suggestions) */

export const ONBOARDING_QUESTIONNAIRE_TASK_WOTA_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT;

/** task branch — “at what time?” (shares task row position with WOTA; separate progress tick) */

export const ONBOARDING_QUESTIONNAIRE_TASK_TIME_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + 1;

/** task branch — “for how long?” (same body strip as WOTA + AWT; timer crossfades to duration slider) */

export const ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + 2;

/** task branch — finish: timeline preview (wake/sleep + task row on real `TimelineView`) */

export const ONBOARDING_QUESTIONNAIRE_TASK_FINISH_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_TASK_DURATION_STEP_INDEX + 1;

/** habit branch — “what is our goal?” */

export const ONBOARDING_QUESTIONNAIRE_HABIT_GOAL_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT;

/** habit branch — “how often?” */

export const ONBOARDING_QUESTIONNAIRE_HABIT_FREQUENCY_STEP_INDEX = ONBOARDING_QUESTIONNAIRE_CORE_PAGE_COUNT + 1;

export type OnboardingQuestionnaireNextStepChoice = 'habit' | 'task';

