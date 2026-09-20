import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../src/context/ThemeContext';
import OutlineIcon, { type OutlineIconName } from '../../src/components/OutlineIcon';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: 4,
          height: 56,
        },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.green,
        headerTitleStyle: { fontFamily: 'Poppins_700Bold', fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon name="home" color={color} focused={focused} activeColor={colors.greenDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon name="scan" color={color} focused={focused} activeColor={colors.greenDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon name="bell" color={color} focused={focused} activeColor={colors.greenDark} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <TabIcon name="settings" color={color} focused={focused} activeColor={colors.greenDark} />
          ),
        }}
      />

      {/* Hide legacy tabs from the bar — files kept for scan history wiring */}
      <Tabs.Screen name="produce" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  name,
  color,
  focused,
  activeColor,
}: {
  name: OutlineIconName;
  color: string;
  focused: boolean;
  activeColor: string;
}) {
  return (
    <View style={[styles.iconWrap, focused && { backgroundColor: activeColor }]}>
      <OutlineIcon name={name} color={color} size={21} strokeWidth={focused ? 2 : 1.7} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
