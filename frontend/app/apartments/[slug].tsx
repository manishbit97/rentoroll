import { StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import { Link, useLocalSearchParams } from "expo-router";
import FlatsList from "@/components/apartments/flatsList";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams();

  return (
    <SafeAreaProvider>
      <ThemedView
        style={{
          ...styles.container,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
        }}
      >
        <ThemedView style={styles.titleContainer}>
          <Link href="/" style={styles.homeicon}>
            {" "}
            <TabBarIcon
              name="home"
              size={32}
              color={colorScheme === "dark" ? "white" : "black"}
              style={styles.homeicon}
            />
          </Link>
          <ThemedText type="title" style={styles.title}>
            RentoRoll
          </ThemedText>
        </ThemedView>
        <ThemedText type="subtitle" id="apartmenttitle" style={styles.subtitle}>
          {slug} Overview{" "}
        </ThemedText>
        <FlatsList></FlatsList>
      </ThemedView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  homeicon: {
    marginTop: 0,
    paddingLeft: 16,
  },
  title: {
    paddingTop: 10,
    paddingLeft: 40,
  },
  subtitle: {
    paddingTop: 10,
    paddingLeft: 16,
    display: "flex",
    justifyContent: "center",
  },
});
