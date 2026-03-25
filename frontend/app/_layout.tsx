import "@/global.css";
import { PortalHost } from "@rn-primitives/portal";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { Toaster } from "sonner-native";

import { useColorScheme } from "@/hooks/useColorScheme";
import { getAuthState } from "@/services/auth";
import { User } from "@/services/api";
import { ThemeProvider as AppThemeProvider } from "@/contexts/ThemeContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Step 1: load auth state (doesn't navigate yet)
  useEffect(() => {
    if (!loaded) return;
    getAuthState().then(({ user }) => {
      setUser(user);
      SplashScreen.hideAsync();
    });
  }, [loaded]);

  // Step 2: navigate only after the Stack has rendered (user !== undefined)
  useEffect(() => {
    if (user === undefined) return;
    redirectByRole(user);
  }, [user]);

  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(landlord)" />
          <Stack.Screen name="(tenant)" />
          <Stack.Screen name="property/[id]" />
          <Stack.Screen name="rent/[roomId]" />
          <Stack.Screen name="rent/history/[roomId]" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <Toaster position="top-center" richColors />
        <PortalHost />
      </ThemeProvider>
    </AppThemeProvider>
  );
}

function redirectByRole(user: User | null) {
  if (!user) {
    router.replace("/(auth)/login");
  } else if (user.role === "landlord") {
    router.replace("/(landlord)");
  } else {
    router.replace("/(tenant)");
  }
}
