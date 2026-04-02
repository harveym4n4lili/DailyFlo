/**
 * Layout Transitions
 *
 * Shared layout transition configs for consistent animations across the app.
 * Used by ListCard (task removal when completed) and Browse screen (My Lists section collapse).
 */

import { LinearTransition } from 'react-native-reanimated';

// spring-based layout transition for smooth item removal / section collapse
// matches ListCard: when task is completed it slides up; when section is minimized it slides up
// overshootClamping prevents bounce past target; damping 28 + stiffness 300 = quick, smooth settle
export const LAYOUT_TRANSITION_SPRING = LinearTransition.springify()
  .damping(28)
  .stiffness(300)
  .overshootClamping(true);
