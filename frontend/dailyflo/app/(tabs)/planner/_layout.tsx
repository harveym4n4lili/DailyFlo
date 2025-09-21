import { Stack } from 'expo-router';

export default function PlannerLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Planner',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
