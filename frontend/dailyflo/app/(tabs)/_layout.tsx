import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useColorPalette';

export default function TabLayout() {
  const themeColors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.interactive.primary(),
        headerShown: false,
      
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            backgroundColor: themeColors.background.primary(),
            borderTopColor: themeColors.border.primary(),
          },
          default: {
            backgroundColor: themeColors.background.elevated(),
            borderTopColor: themeColors.border.primary(),
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        
        options={{
          href: null, // Hide this route from the tab bar
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={size*0.8} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'grid' : 'grid-outline'} 
              size={size*0.8} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'list' : 'list-outline'} 
              size={size} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? 'settings' : 'settings-outline'} 
              size={size*0.8} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
