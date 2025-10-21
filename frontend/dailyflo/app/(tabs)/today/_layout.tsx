import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

export default function TodayLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Today',
            headerShown: false 
          }} 
        />
      </Stack>
    </View>
  );
}
