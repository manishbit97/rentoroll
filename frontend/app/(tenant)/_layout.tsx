import { Tabs } from "expo-router";
import { TabBarAntIcon, TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TenantLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: "#e5e7eb" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Rent",
          tabBarIcon: ({ color }) => <TabBarMaterialIcon name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <TabBarMaterialIcon name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarAntIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
