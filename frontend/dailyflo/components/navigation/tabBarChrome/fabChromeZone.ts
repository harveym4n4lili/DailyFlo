import { FAB_CHROME_ZONE } from './tabBarChrome.constants';
import type { ViewStyle } from 'react-native';

/**
 * shared absolute wrapper for FloatingActionButton on tab screens — same footprint as the old inline styles.
 * pair with FloatingActionButton from @/components/ui/button (metrics context syncs FAB size to navbar).
 */
export const fabChromeZoneStyle: ViewStyle = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  left: 0,
  height: FAB_CHROME_ZONE.height,
  pointerEvents: 'box-none',
};
