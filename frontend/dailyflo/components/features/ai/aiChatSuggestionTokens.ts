import { Paddings } from '@/constants/Paddings';

/** ai chat suggestion — short task title shown on the pill; description is sent as the prompt */
export type AiChatSuggestion = {
  title: string;
  description: string;
};

/** gap between the suggestions block and the chat composer shell */
export const CHAT_SUGGESTIONS_TO_COMPOSER_GAP = Paddings.groupedListIconTextSpacing;

/** max pill width so one-line descriptions truncate cleanly in the horizontal row */
export const CHAT_SUGGESTION_CHIP_MAX_WIDTH = 200;

/** default sideways suggestions — titles mirror onboarding pills; descriptions are full prompts */
export const AI_CHAT_SUGGESTIONS: readonly AiChatSuggestion[] = [
  {
    title: 'Morning standup',
    description: 'Add a morning standup to my schedule for today.',
  },
  {
    title: 'Email inbox',
    description: 'Block time today to clear my email inbox.',
  },
  {
    title: 'Focus block',
    description: 'Create a focus block for deep work this afternoon.',
  },
  {
    title: 'Walk outside',
    description: 'Schedule a walk outside for today.',
  },
  {
    title: 'Plan tomorrow',
    description: 'Help me plan my tasks for tomorrow.',
  },
  {
    title: 'Team sync',
    description: 'Schedule a team sync meeting this week.',
  },
  {
    title: 'Deep work',
    description: 'Block two hours for deep work on my top priority.',
  },
  {
    title: 'Quick errands',
    description: 'Add my quick errands to today’s task list.',
  },
];
