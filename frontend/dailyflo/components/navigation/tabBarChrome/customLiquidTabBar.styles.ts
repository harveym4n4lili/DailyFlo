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
    paddingVertical: v.glassBleedPaddingV,
    paddingHorizontal: v.glassBleedPaddingH,
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
    justifyContent: 'space-evenly',
    width: '100%',
    paddingVertical: v.innerPaddingV,
    paddingHorizontal: v.innerPaddingH,
  },
  customTabItem: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 48,
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
