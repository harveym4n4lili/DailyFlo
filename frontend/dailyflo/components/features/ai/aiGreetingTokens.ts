/** empty-state greetings for the ai tab — each string is exactly three words, one line */
export const AI_GREETINGS = [
  'Ready to help!',
  "Let's plan today!",
  'What needs doing!',
  'Welcome back friend!',
  'Time to organize!',
  "Let's get started!",
  'Need help planning!',
  'Nice seeing you!',
  'Back for more!',
  'What needs planning!',
] as const;

/** empty-state hint prompts — max two lines, shown under the greeting */
export const AI_HINTS = [
  'What do you need to schedule?',
  "Tell me what you'd like\nto organize today.",
  'Want help planning\nyour week ahead?',
  'What tasks should we\nadd or update?',
  'Need a hand clearing\nyour to-do list?',
] as const;

/** pick one greeting at random — called when the ai tab gains focus */
export function pickRandomAiGreeting(): string {
  const index = Math.floor(Math.random() * AI_GREETINGS.length);
  return AI_GREETINGS[index];
}

/** pick one hint prompt at random — called when the ai tab gains focus */
export function pickRandomAiHint(): string {
  const index = Math.floor(Math.random() * AI_HINTS.length);
  return AI_HINTS[index];
}
