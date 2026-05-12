/**
 * intro carousel body — scrolls horizontally with each page while titles stay in the crossfade overlay.
 * placeholder card UI removed; add per-slide art or hero content inside the shell region below the headline spacer.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';

export type IntroSlideSampleContentProps = {
  /** 0-based slide — pick assets or layout variants per intro beat */
  pageIndex: number;
};

export function IntroSlideSampleContent({ pageIndex: _pageIndex }: IntroSlideSampleContentProps) {
  // `_pageIndex` reserved when each intro page gets distinct imagery or copy blocks here

  return (
    <View style={styles.bodySlot} accessibilityLabel="Intro slide body content">
      {/* primary visuals / messaging blocks belong here — sits under INTRO_FIXED_HEADLINE_OVERLAY_HEIGHT spacer */}
    </View>
  );
}

const styles = StyleSheet.create({
  bodySlot: {
    flex: 1,
    width: '100%',
  },
});
