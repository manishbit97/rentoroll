import { StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import ThemedButton from "@/components/button";
import ThemedHeader from "@/components/header";
import { ThemedView } from "@/components/ThemedView";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import ManageFlatFields from "@/components/manageflats/flatfields";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function HomeScreen() {
  const { slug } = useLocalSearchParams();

  return (
    <SafeAreaProvider>
      <ThemedHeader headerTitle={"Manage Flats"} />
      <ThemedView style={styles.manageContainer} id="mgcont">
        <ThemedButton
          title={"Add Tenants"}
          onPress={() => {}}
          style={styles.button}
        >
          <ThemedView
            style={styles.addTenant}
            lightColor="transparent"
            darkColor="transparent"
          >
            <MaterialCommunityIcons name="plus" color={"#fff"} size={16} />
            <ThemedText type="default" lightColor="white">
              Add Tenants
            </ThemedText>
          </ThemedView>
        </ThemedButton>
      </ThemedView>
      <KeyboardAwareScrollView id="Scroll" style={{ maxHeight: "680px" }}>
        <ManageFlatFields />
      </KeyboardAwareScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  manageContainer: {
    // flex: 1,
    padding: 16,
    backgroundColor: "transparent",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  addTenant: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    gap: 8,
  },
  icon: {
    marginRight: 8,
    color: "#fff",
  },
});
