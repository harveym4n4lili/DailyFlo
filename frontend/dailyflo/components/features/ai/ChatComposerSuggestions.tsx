/**
 * ai chat suggestions — one horizontal row of pills with title + description.
 * tapping a pill autofills the prompt with the description (not the title).
 * fades out while the chat composer text section expands (same timing as ChatContainer).
 */

import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { ONBOARDING_SLIDES_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE_TEXT_STYLE } from '@/components/features/onboarding/onboarding/constants/typography';
import {
  ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
} from '@/components/features/onboarding/onboarding/constants/pagerLayout';
import { useColorPalette, useThemeColors } from '@/hooks/useColorPalette';
import { Paddings } from '@/constants/Paddings';
import {
  getChatSendButtonColors,
  CHAT_COMPOSER_LAYOUT_EASING,
  CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
  CHAT_SUGGESTIONS_HIDDEN_SCALE,
  CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH,
} from './chatComposerUiTokens';
import {
  AI_CHAT_SUGGESTIONS,
  CHAT_SUGGESTIONS_TO_COMPOSER_GAP,
  type AiChatSuggestion,
} from './aiChatSuggestionTokens';
import { ChatSuggestionChip } from './ChatSuggestionChip';

/** horizontal inset for the composer anchor — chip row bleeds to screen edges then pad back */
const COMPOSER_HORIZONTAL_INSET = Paddings.groupedListHeaderContentGap;

export interface ChatComposerSuggestionsProps {
  /** current chat prompt — highlights the chip whose description matches */
  activePrompt: string;
  /** true when ChatContainer text section is expanded (text + keyboard open) */
  isComposerExpanded: boolean;
  /** 0 = prompt phase, 1 = session — fades suggestions out during slide-up morph */
  sessionProgress?: SharedValue<number>;
  /** true when session morph finished — collapses suggestion slot */
  isSessionMode?: boolean;
  /** true while sliding back to greeting — uncollapse slot so pills fade in with sessionProgress */
  isSessionReturningToGreeting?: boolean;
  /** called with the suggestion description when the user taps a pill */
  onPickSuggestion: (description: string) => void;
  suggestions?: readonly AiChatSuggestion[];
}

function promptsMatch(a: string, b: string): boolean {
  return a.trim() === b.trim();
}

export function ChatComposerSuggestions({
  activePrompt,
  isComposerExpanded,
  sessionProgress,
  isSessionMode = false,
  isSessionReturningToGreeting = false,
  onPickSuggestion,
  suggestions = AI_CHAT_SUGGESTIONS,
}: ChatComposerSuggestionsProps) {
  const themeColors = useThemeColors();
  const colors = useColorPalette();

  const rowTitleColor = themeColors.text.primary();
  const rowDescriptionColor = themeColors.text.secondary();
  const sendColors = getChatSendButtonColors(colors);

  // 0 = visible (composer minimized), 1 = hidden (composer expanded)
  const hideProgress = useSharedValue(isComposerExpanded ? 1 : 0);
  const [slotCollapsed, setSlotCollapsed] = useState(isComposerExpanded);

  useEffect(() => {
    hideProgress.value = withTiming(isComposerExpanded ? 1 : 0, {
      duration: CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      easing: CHAT_COMPOSER_LAYOUT_EASING,
    });

    if (isComposerExpanded) {
      const id = setTimeout(
        () => setSlotCollapsed(true),
        CHAT_COMPOSER_LAYOUT_TRANSITION_MS,
      );
      return () => clearTimeout(id);
    }

    setSlotCollapsed(false);
  }, [isComposerExpanded, hideProgress]);

  // back slide — expand slot immediately so opacity can fade in with sessionProgress (not flash at end)
  useEffect(() => {
    if (isSessionReturningToGreeting) {
      setSlotCollapsed(false);
    }
  }, [isSessionReturningToGreeting]);

  useAnimatedReaction(
    () => sessionProgress?.value ?? 0,
    (session, previous) => {
      if (session > 0.99 && (previous ?? 0) <= 0.99) {
        runOnJS(setSlotCollapsed)(true);
      }
    },
    [sessionProgress],
  );

  const animatedSectionStyle = useAnimatedStyle(() => {
    const sessionHide = sessionProgress?.value ?? 0;
    const composerHide = hideProgress.value;
    const combinedHide = Math.max(composerHide, sessionHide);
    return {
      opacity: 1 - combinedHide,
      marginBottom: interpolate(
        combinedHide,
        [0, 1],
        [CHAT_SUGGESTIONS_TO_COMPOSER_GAP, 0],
      ),
      transform: [
        {
          scale: interpolate(
            combinedHide,
            [0, 1],
            [1, CHAT_SUGGESTIONS_HIDDEN_SCALE],
          ),
        },
      ],
    };
  });

  const isInteractionBlocked =
    isComposerExpanded || (isSessionMode && !isSessionReturningToGreeting);

  return (
    <Animated.View
      style={[
        styles.sectionRoot,
        animatedSectionStyle,
        slotCollapsed && !isSessionReturningToGreeting && styles.sectionCollapsed,
      ]}
      pointerEvents={isInteractionBlocked ? 'none' : 'box-none'}
      accessibilityRole="none"
      accessibilityLabel="Suggested prompts"
    >
      <Text
        style={[
          ONBOARDING_SLIDES_TASK_AGENDA_SUGGESTIONS_SECTION_TITLE_TEXT_STYLE,
          styles.title,
          { color: themeColors.text.secondary() },
        ]}
      >
        Suggestions
      </Text>
      <View style={styles.chipScrollBleed}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          removeClippedSubviews={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipScrollContent}
        >
          {suggestions.map((item, index) => (
            <ChatSuggestionChip
              key={`${item.title}-${index}`}
              title={item.title}
              description={item.description}
              selected={promptsMatch(activePrompt, item.description)}
              onSelect={() => onPickSuggestion(item.description)}
              titleTextColor={rowTitleColor}
              descriptionTextColor={rowDescriptionColor}
              selectedBrandColor={sendColors.fill}
              sparklesIdleColor={sendColors.fill}
              sparklesSelectedColor={sendColors.icon}
            />
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sectionRoot: {
    zIndex: 1,
    overflow: 'visible',
    ...(Platform.OS === 'android' ? { elevation: 4 } : null),
  },
  // applied only after hide animation completes — never during fade (avoids bottom clip)
  sectionCollapsed: {
    height: 0,
    marginBottom: 0,
    overflow: 'hidden',
  },
  title: {
    marginBottom: Paddings.formDataPillIconGap,
    paddingHorizontal: COMPOSER_HORIZONTAL_INSET,
  },
  chipScrollBleed: {
    marginHorizontal: -COMPOSER_HORIZONTAL_INSET,
    overflow: 'visible',
  },
  chipScroll: {
    flexGrow: 0,
    overflow: 'visible',
  },
  chipScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: COMPOSER_HORIZONTAL_INSET,
    paddingRight: COMPOSER_HORIZONTAL_INSET,
    // room for chip hairline border so ScrollView does not clip pill bottoms
    paddingBottom: CHAT_COMPOSER_SHELL_DASHED_STROKE_WIDTH,
    gap: ONBOARDING_TASK_AGENDA_SUGGESTIONS_ROW_GAP,
  },
});
