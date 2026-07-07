/**
 * session proposal list footer — Accept All / Start new share the same FAB brand icon pill;
 * cross-fades when mode switches after proposals are handled.
 */

import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import {
  QuickAddIconPill,
  QUICK_ADD_ICON_PILL_ICON_SIZE,
} from '@/components/features/tasks/quickAdd/QuickAddIconPill';
import { SFSymbolIcon } from '@/components/ui/Icon';
import { useColorPalette } from '@/hooks/useColorPalette';
import { CHAT_SESSION_RESPONSE_GAP, getChatSendButtonColors } from './chatComposerUiTokens';

export type AiSessionProposalFooterMode = 'acceptAll' | 'startNew';

/** fade when footer swaps Accept All ↔ Start new */
const FOOTER_MODE_TRANSITION_MS = 220;

export interface AiSessionProposalFooterProps {
  mode: AiSessionProposalFooterMode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AiSessionProposalFooter({
  mode,
  onPress,
  loading = false,
  disabled = false,
}: AiSessionProposalFooterProps) {
  const colors = useColorPalette();
  // marple 500 fill + 600 icon — same ramp as FloatingActionButton / Accept All
  const brandColors = useMemo(() => getChatSendButtonColors(colors), [colors]);
  const isAcceptAll = mode === 'acceptAll';
  // block duplicate taps while bulk accept runs or parent disables the footer
  const inactive = disabled || loading;

  const pillIcon = useMemo(() => {
    if (isAcceptAll) {
      return (
        <SFSymbolIcon
          name="checkmark.circle.fill"
          size={QUICK_ADD_ICON_PILL_ICON_SIZE}
          color={brandColors.icon}
          fallback={
            <Ionicons
              name="checkmark-circle"
              size={QUICK_ADD_ICON_PILL_ICON_SIZE}
              color={brandColors.icon}
            />
          }
        />
      );
    }
    return (
      <SFSymbolIcon
        name="plus.circle.fill"
        size={QUICK_ADD_ICON_PILL_ICON_SIZE}
        color={brandColors.icon}
        fallback={
          <Ionicons
            name="add-circle"
            size={QUICK_ADD_ICON_PILL_ICON_SIZE}
            color={brandColors.icon}
          />
        }
      />
    );
  }, [isAcceptAll, brandColors.icon]);

  const label = isAcceptAll ? 'Accept All' : 'Start new';
  const accessibilityLabel = isAcceptAll ? 'Accept all proposals' : 'Start new';

  return (
    <View style={styles.root}>
      <View style={styles.pillSlot}>
        <Animated.View
          key={mode}
          entering={FadeIn.duration(FOOTER_MODE_TRANSITION_MS)}
          exiting={FadeOut.duration(FOOTER_MODE_TRANSITION_MS)}
          style={styles.pillAnimHost}
        >
          <QuickAddIconPill
            icon={pillIcon}
            label={label}
            onPress={onPress}
            variant="primarySecondaryBlend"
            blendSurfaceColor={brandColors.fill}
            accessibilityLabel={accessibilityLabel}
            textColor={brandColors.icon}
            disabled={inactive}
          />
        </Animated.View>
        {loading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={brandColors.icon} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: CHAT_SESSION_RESPONSE_GAP,
    position: 'relative',
  },
  pillSlot: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  pillAnimHost: {
    alignSelf: 'flex-start',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
