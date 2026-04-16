import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useColorPalette';

export default function BrowseLayout() {
  const themeColors = useThemeColors();
  return (
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
      {/* inbox, completed, tags: push + back + big/mini header */}
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
      <Stack.Screen
        name="tags"
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
                title: 'Tags',
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
    </Stack>
  );
}
