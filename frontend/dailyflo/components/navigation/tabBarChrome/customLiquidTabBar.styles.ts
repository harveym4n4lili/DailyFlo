import { Platform, StyleSheet } from 'react-native';
import { TAB_BAR_CHROME_VISUAL } from './tabBarChrome.constants';

const v = TAB_BAR_CHROME_VISUAL;

export const customLiquidTabBarStyles = StyleSheet.create({
  customTabToolbarWrap: {
    position: 'absolute',
    zIndex: v.wrapZIndex,
    overflow: 'visible',
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
