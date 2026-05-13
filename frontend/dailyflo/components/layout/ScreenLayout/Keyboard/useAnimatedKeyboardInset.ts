/**
 * exposes reanimated keyboard `height` for layout (marginBottom, translateY, etc.).
 *
 * this uses `useAnimatedKeyboard()` so `height` is driven on the ui thread alongside the ios keyboard —
 * smoother than bridging `keyboardWillChangeFrame` into a sharedValue from javascript each tick.
 *
 * note: android needs `adjustResize` in manifest for best results when using this hook; see reanimated docs.
 * (still deprecated upstream in favour of react-native-keyboard-controller, but avoids a new dependency here.)
 */
import { useAnimatedKeyboard } from 'react-native-reanimated';

export function useAnimatedKeyboardInset() {
  const keyboard = useAnimatedKeyboard();
  return keyboard.height;
}
