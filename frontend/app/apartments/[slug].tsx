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
import { BackIcon } from "@/components/navigation/BackIcon";
import ThemedHeader from "@/components/header";

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
        {/* <ThemedView style={styles.headerContainer}>
          <BackIcon />
          <ThemedText type="title" style={styles.title}>
            RentoRoll
          </ThemedText>
        </ThemedView> */}
        <ThemedHeader headerTitle={"Flats List"} />
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backContainer: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
  },
  homeicon: {
    marginTop: 0,
    paddingLeft: 16,
  },
  title: {
    paddingTop: 15,
    paddingLeft: 62,
  },
  subtitle: {
    padding: 10,
    display: "flex",
    justifyContent: "center",
  },
});
