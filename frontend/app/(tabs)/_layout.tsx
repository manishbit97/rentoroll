import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon, TabBarMaterialIcon,TabBarAntIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            // <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            <TabBarAntIcon name={ 'home'} color={color} />
          ),
        }}
      />
    
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Tenants',
          tabBarIcon: ({ color, focused }) => (
            <TabBarAntIcon name={ 'user'} color={color} />
          ),
        }}
      />
        <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarAntIcon name={ 'setting'} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}
