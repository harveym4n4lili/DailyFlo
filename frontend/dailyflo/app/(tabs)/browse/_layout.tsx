import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';
import { TASK_SELECTION_STACK_ANIMATION } from '@/constants/nativeStackTransition';
import { SettingsScheduleSelectProvider } from '@/app/SettingsScheduleSelectContext';

const useLiquidGlass = Platform.OS === 'ios' && !Platform.isPad;

/** same glass form sheet as planner `month-select` — 60% detent, transparent ios fill */
const scheduleTimeSheetOptions = (themeColors: ReturnType<typeof useThemeColors>) => ({
  headerShown: false,
  presentation: Platform.OS === 'ios' ? (useLiquidGlass ? 'formSheet' : 'modal') : 'modal',
  sheetGrabberVisible: false,
  sheetAllowedDetents: [0.6],
  sheetInitialDetentIndex: 0,
  contentStyle: {
    backgroundColor: useLiquidGlass ? 'transparent' : themeColors.background.secondary(),
  },
});

export default function BrowseLayout() {
  const themeColors = useThemeColors();
  const timeSheetOptions = scheduleTimeSheetOptions(themeColors);
  return (
    <SettingsScheduleSelectProvider>
    <Stack
      screenOptions={{
        animation: 'default', // native iOS slide-from-right (push)
        gestureEnabled: true,
        contentStyle: { backgroundColor: themeColors.background.primary() },
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
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Browse',
                headerShown: false,
              }
        }
      />
      <Stack.Screen
        name="search"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                headerShown: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
        }
      />
      {/* settings: modal — ios native header + Stack.Toolbar close; android glass MainCloseButton in-screen */}
      <Stack.Screen
        name="settings"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
            : {
                headerShown: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
        }
      />
      {/* navigation: push from settings — back + edit/apply toolbar */}
      <Stack.Screen
        name="navigation"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Navigation',
                headerShown: false,
              }
        }
      />
      {/* inbox, completed: push + back + big/mini header */}
      <Stack.Screen
        name="inbox"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Inbox',
                headerShown: false,
              }
        }
      />
      <Stack.Screen
        name="task-select"
        options={
          Platform.OS === 'ios'
            ? {
                animation: TASK_SELECTION_STACK_ANIMATION,
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Select tasks',
                headerShown: false,
              }
        }
      />
      <Stack.Screen
        name="completed"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : {
                title: 'Completed',
                headerShown: false,
              }
        }
      />
      {/* list/[listId]: push screen for a single list (same chrome pattern as inbox) */}
      <Stack.Screen
        name="list/[listId]"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                contentStyle: { backgroundColor: themeColors.background.primary() },
              }
            : { headerShown: false }
        }
      />
      {/* manage-lists: modal — ios Stack.Toolbar close + create; android glass buttons in-screen */}
      <Stack.Screen
        name="manage-lists"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
            : {
                title: 'Manage Lists',
                headerShown: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
        }
      />
      {/* list-create: modal — ios Stack.Toolbar close + checkmark; android glass in-screen */}
      <Stack.Screen
        name="list-create"
        options={
          Platform.OS === 'ios'
            ? {
                headerShown: true,
                headerTransparent: true,
                headerTitle: '',
                headerShadowVisible: false,
                headerBackVisible: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
            : {
                title: 'New List',
                headerShown: false,
                presentation: 'modal',
                gestureEnabled: false,
                contentStyle: {
                  backgroundColor: themeColors.background.primary(),
                },
              }
        }
      />
      <Stack.Screen name="wake-time-select" options={timeSheetOptions} />
      <Stack.Screen name="sleep-time-select" options={timeSheetOptions} />
    </Stack>
    </SettingsScheduleSelectProvider>
  );
}
