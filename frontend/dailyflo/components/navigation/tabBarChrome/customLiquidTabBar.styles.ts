import { Platform, StyleSheet } from 'react-native';
import { TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';

const v = TAB_BAR_CHROME_VISUAL;

export const customLiquidTabBarStyles = StyleSheet.create({
  // parent for fade + navbar: one stacking context so fade stays strictly under the pill
  chromeOverlayStack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: v.chromeOverlayStackZIndex,
  },
  // edge-to-edge band at screen bottom (same width as chromeOverlayStack, not the inset navbar pill)
  bottomChromeFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: v.chromeFadeRelativeZIndex,
    ...Platform.select({
      // android draw order follows elevation; keep fade under the nav strip
      android: { elevation: 0 },
      default: {},
    }),
  },
  customTabToolbarWrap: {
    position: 'absolute',
    zIndex: v.chromeNavBarRelativeZIndex,
    overflow: 'visible',
    ...Platform.select({
      android: { elevation: 12 },
      default: {},
    }),
  },
  customTabGlass: {
    borderRadius: v.glassBorderRadius,
    overflow: 'visible',
    width: '100%',
  },
  customTabGlassBleed: {
    overflow: 'visible',
    width: '100%',
    padding: v.tabBarInset,
  },
  customTabToolbarFallback: {
    borderRadius: v.fallbackBorderRadius,
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
    ...Platform.select({
      android: { elevation: 6 },
      default: {},
    }),
  },
  customTabToolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    // same value as tabBarInset on the bleed — equal gutter at edges and between columns
    gap: v.tabBarInset,
  },
  customTabItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: v.tabItemPaddingV,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTabItemPressed: {
    opacity: 0.85,
  },
  customTabIcon: {
    width: v.tabIconSize,
    height: v.tabIconSize,
  },
});
