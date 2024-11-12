import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BackIcon } from "@/components/navigation/BackIcon";

export default function ThemedHeader({ headerTitle }: any) {
  const insets = useSafeAreaInsets();
  console.log(insets);
  return (
    <ThemedView
      style={{
        ...styles.headerContainer,
        paddingTop: insets.top || 16,
        paddingBottom: 16,
        paddingLeft: insets.left || 16,
        paddingRight: insets.right || 16,
        gap: 8,
      }}
      id="headercontainer"
    >
      <ThemedView id="backiconcontainer">
        <BackIcon />
      </ThemedView>
      <ThemedText id="headertitle" type="title" style={styles.title}>
        {headerTitle}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  backContainer: {
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
  },
  title: {
    flex: 1,
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "500",
  },
});
