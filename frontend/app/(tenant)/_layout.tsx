import { TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { Tabs } from "expo-router";

export default function TenantLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "My Rent",
          tabBarIcon: ({ color }) => <TabBarMaterialIcon name="home-account" color={color} />,
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
          tabBarIcon: ({ color }) => <TabBarMaterialIcon name="account-circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
