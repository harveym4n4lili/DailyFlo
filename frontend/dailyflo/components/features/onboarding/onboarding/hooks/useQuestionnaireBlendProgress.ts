/**

 * drives fractional `pageProgress` (0 … lastIndex) with `Animated.timing` when the questionnaire step index changes,

 * so chrome can rgb-lerp like intro’s scroll-driven `pageProgress` (no horizontal scroll here).

 * `blendProgressAnim` feeds opacity crossfades; `blendProgress` is the same curve as a plain number for useMemo.

 */



import { useEffect, useRef, useState } from 'react';

import { Animated, Easing } from 'react-native';



import { ONBOARDING_SLIDES_CONTROL_TRANSITION_MS } from '../constants';



export type UseQuestionnaireBlendProgressResult = {

  blendProgress: number;

  blendProgressAnim: Animated.Value;

};



export function useQuestionnaireBlendProgress(pageIndex: number): UseQuestionnaireBlendProgressResult {

  const blendProgressAnim = useRef(new Animated.Value(pageIndex)).current;

  const [blendProgress, setBlendProgress] = useState(pageIndex);

  const skipFirstSpring = useRef(true);



  useEffect(() => {

    const id = blendProgressAnim.addListener(({ value }) => setBlendProgress(value));

    return () => blendProgressAnim.removeListener(id);

  }, [blendProgressAnim]);



  useEffect(() => {

    if (skipFirstSpring.current) {

      skipFirstSpring.current = false;

      blendProgressAnim.setValue(pageIndex);

      setBlendProgress(pageIndex);

      return;

    }

    Animated.timing(blendProgressAnim, {

      toValue: pageIndex,

      duration: ONBOARDING_SLIDES_CONTROL_TRANSITION_MS,

      easing: Easing.out(Easing.cubic),

      useNativeDriver: false,

    }).start();

  }, [pageIndex, blendProgressAnim]);



  return { blendProgress, blendProgressAnim };

}


