import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export function BackIcon({ styleContainer }: any) {
  const onBackClick = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <ThemedView style={[styles.cardLikeWrapper, styleContainer]} id="backIcon">
      <TouchableOpacity onPress={onBackClick} style={styles.touchable}>
        <ThemedView style={styles.cardLike}>
          <MaterialIcons color={"#222"} name="arrow-back" size={20} />
        </ThemedView>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cardLikeWrapper: {
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  touchable: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cardLike: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    backgroundColor: "#EBEDED",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BackIcon;
