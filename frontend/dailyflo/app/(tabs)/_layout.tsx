import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useColorPalette';
import { useTypography } from '@/hooks/useTypography';
// useThemeColor: hook that provides the global theme color selected by the user
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const themeColors = useThemeColors();
  const typography = useTypography();
  // get the global theme color selected by the user (default: red)
  const { getThemeColorValue } = useThemeColor();
  const themeColor = getThemeColorValue(500); // use shade 500 for active tab color

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColor, // use global theme color for active tabs
        tabBarInactiveTintColor: themeColors.text.secondary(), // secondary text color for inactive tabs
        headerShown: false,
        
        // configure tab bar label style using typography system
        tabBarLabelStyle: {
          // use the navbar text style from our typography system (includes satoshi font)
          ...typography.getTextStyle('navbar'),
        },
      
        tabBarStyle: Platform.select({
          ios: {
            // Use elevated background to match task card colors
            position: 'absolute',
            backgroundColor: themeColors.background.elevated(),
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
