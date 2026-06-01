/**

 * ios browse home only: native Stack.Toolbar with sf symbols — search on the left, settings on the right.

 * android keeps ScreenHeaderActions in browse/index (glass row).

 */



import React from 'react';

import { Platform } from 'react-native';

import { Stack } from 'expo-router';



import { useGuardedRouter } from '@/hooks/useGuardedRouter';

import { useThemeColors } from '@/hooks/useColorPalette';



export type IosBrowseHomeStackToolbarProps = {

  onSearchPress?: () => void;

};



export function IosBrowseHomeStackToolbar({ onSearchPress }: IosBrowseHomeStackToolbarProps) {

  const router = useGuardedRouter();

  const themeColors = useThemeColors();

  const tint = themeColors.text.primary();



  if (Platform.OS !== 'ios') {

    return null;

  }



  return (

    <>

      <Stack.Toolbar placement="left">

        <Stack.Toolbar.Button

          icon="magnifyingglass"

          onPress={onSearchPress ?? (() => router.push('/(tabs)/browse/search' as any))}

          accessibilityLabel="Search"

          tintColor={tint}

        />

      </Stack.Toolbar>

      <Stack.Toolbar placement="right">

        <Stack.Toolbar.Button

          icon="gearshape"

          onPress={() => router.push('/(tabs)/browse/settings' as any)}

          accessibilityLabel="Settings"

          tintColor={tint}

        />

      </Stack.Toolbar>

    </>

  );

}


