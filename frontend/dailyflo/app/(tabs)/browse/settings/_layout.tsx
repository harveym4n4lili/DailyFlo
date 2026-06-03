import { Platform } from 'react-native';
import { Stack } from 'expo-router';

import { NavigationSettingsDraftProvider } from '@/components/features/settings/navigation/NavigationSettingsDraftContext';
import { navigationPushStackOptions } from '@/components/features/settings/navigation/navigationStackChrome';
import { useThemeColors } from '@/hooks/useColorPalette';

/** settings modal stack — index is modal root; navigation + tab bar options push in the same stack for native toolbar morph */
export default function BrowseSettingsLayout() {
  const themeColors = useThemeColors();
  const navigationPushOptions = navigationPushStackOptions(themeColors);

  return (
    <NavigationSettingsDraftProvider>
      <Stack
        screenOptions={{
          animation: 'default',
          gestureEnabled: true,
          contentStyle: { backgroundColor: themeColors.background.root() },
        }}
      >
        <Stack.Screen
          name="index"
          options={
            Platform.OS === 'ios'
              ? {
                  headerShown: true,
                  headerTransparent: true,
                  headerTitle: '',
                  headerShadowVisible: false,
                  headerBackVisible: false,
                  contentStyle: { backgroundColor: themeColors.background.root() },
                }
              : {
                  title: 'Settings',
                  headerShown: false,
                }
          }
        />
        {/* flat routes under navigation/ — no nested _layout so xmark → back morphs natively */}
        <Stack.Screen name="navigation/index" options={navigationPushOptions} />
        <Stack.Screen name="navigation/tab-bar-options" options={navigationPushOptions} />
      </Stack>
    </NavigationSettingsDraftProvider>
  );
}
