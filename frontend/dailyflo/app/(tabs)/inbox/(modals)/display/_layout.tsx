import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useColorPalette';
import { DisplaySettingsDraftProvider } from '@/components/features/display/DisplaySettingsDraftContext';
import {
  displayModalIndexStackOptions,
  displaySortPushStackOptions,
} from '@/components/features/display/displayStackChrome';

/** nested stack inside the inbox display modal — same pattern as today/display */
export default function InboxDisplayLayout() {
  const themeColors = useThemeColors();
  const pushOptions = displaySortPushStackOptions(themeColors);

  return (
    <DisplaySettingsDraftProvider context="inbox">
      <Stack
        screenOptions={{
          animation: 'default',
          gestureEnabled: true,
          contentStyle: { backgroundColor: themeColors.background.primary() },
        }}
      >
        <Stack.Screen name="index" options={displayModalIndexStackOptions(themeColors)} />
        <Stack.Screen name="sorting" options={pushOptions} />
        <Stack.Screen name="ordering" options={pushOptions} />
        <Stack.Screen name="date" options={pushOptions} />
        <Stack.Screen name="priority" options={pushOptions} />
      </Stack>
    </DisplaySettingsDraftProvider>
  );
}
