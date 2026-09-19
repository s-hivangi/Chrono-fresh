import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#469110',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#D6E3CE' },
        headerStyle: { backgroundColor: '#F4F8F0' },
        headerTintColor: '#469110',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }: { color: string }) => <TabIcon label="🏠" color={color} />,
        }}
      />
      <Tabs.Screen name="produce" options={{ title: 'My Produce', tabBarIcon: ({ color }: { color: string }) => <TabIcon label="🥬" color={color} /> }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', tabBarIcon: ({ color }: { color: string }) => <TabIcon label="📷" color={color} /> }} />
      <Tabs.Screen name="history" options={{ title: 'History', tabBarIcon: ({ color }: { color: string }) => <TabIcon label="🕘" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ label, color }: { label: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#469110' ? 1 : 0.5 }}>{label}</Text>;
}
