import { Stack } from 'expo-router';

export default function BrowseLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Browse',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
