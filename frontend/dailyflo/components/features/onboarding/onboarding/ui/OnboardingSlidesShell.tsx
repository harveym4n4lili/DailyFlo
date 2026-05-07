/**
 * body shell under the native transparent stack header (back + progress + skip).
 * header does not reserve layout for the screen body, so we offset by `useHeaderHeight()` — same idea as
 * intro’s `titleLayerTop={headerHeight + Paddings.screen}` — then keep horizontal inset like intro.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paddings } from '@/constants/Paddings';

/** small breathing room below the header row — matches intro title offset past chrome */
const GAP_BELOW_HEADER = Paddings.screen;

export type OnboardingSlidesShellProps = {
  children: React.ReactNode;
};

export function OnboardingSlidesShell({ children }: OnboardingSlidesShellProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const bottomPadding = Math.max(insets.bottom, Paddings.screen) + 48;

  return (
    <View style={styles.column}>
      <View
        style={[
          styles.content,
          {
            paddingTop: headerHeight + GAP_BELOW_HEADER,
            paddingHorizontal: Paddings.screen + Paddings.screenSmall,
            paddingBottom: bottomPadding,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
