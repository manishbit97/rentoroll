import { Tabs } from "expo-router";
import { TabBarAntIcon, TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function LandlordLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Properties",
          tabBarIcon: ({ color }) => (
            <TabBarAntIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <TabBarMaterialIcon name="chart-bar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <TabBarAntIcon name="setting" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
