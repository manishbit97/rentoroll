import React, { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import FeatherIcon from "react-native-vector-icons/Feather";
import FlatListToggleButton from "../togglebutton";
import { TabBarMaterialIcon } from "@/components/navigation/TabBarIcon";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";

const flats = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80",
    name: "Flat #101",
    flatDetails: "Manish Kumar | 2 BHK | ₹5000",
    isOccupied: true,
    isRentDue: true,
  },

  {
    id: 1,
    img: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80",
    name: "Flat #102",
    flatDetails: "Shivangi Singh | 2 BHK | ₹4000",
    isOccupied: true,
    isRentDue: false,
  },
  {
    id: 2,
    img: "",
    name: "Flat #103",
    flatDetails: "Unoccupied | 2 BHK | ₹5000",
    isOccupied: false,
    isRentDue: false,
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80",
    name: "Flat #104",
    flatDetails: "Nidhi | 2 BHK | ₹4000",
    isOccupied: true,
    isRentDue: false,
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=2.5&w=256&h=256&q=80",
    name: "Flat #104",
    flatDetails: "Arjun | 2 BHK | ₹4500",
    isOccupied: true,
    isRentDue: true,
  },
  {
    id: 5,
    img: "",
    name: "Flat #105",
    flatDetails: "Unoccupied | 2 BHK | ₹4000",
    isOccupied: false,
    isRentDue: false,
  },
];
const tabs = [
  { id: 1, name: "All Flats", img: "home-analytics" },
  { id: 2, name: "Rent Due", img: "alert-outline" },
  { id: 3, name: "Vacant", img: "bed-outline" },
];

export default function FlatsList() {
  const [input, setInput] = useState("");
  const [selectedTab, setSelectedTab] = useState(1);
  const [filteredRows, setFilteredRows] = useState<any>(flats);
  const color = useColorScheme();

  const rows = useMemo(() => {
    const rows = [];
    const query = input.toLowerCase();

    for (const item of flats) {
      const nameIndex = item.name.toLowerCase().search(query);
      const flatDetailsIndex = item.flatDetails.toLowerCase().search(query);

      if (nameIndex !== -1 || flatDetailsIndex !== -1) {
        if (
          selectedTab === 1 ||
          (selectedTab === 2 && item.isRentDue) ||
          (selectedTab === 3 && !item.isOccupied)
        ) {
          rows.push({
            ...item,
            index: nameIndex !== -1 ? nameIndex : flatDetailsIndex,
          });
        }
      }
    }

    return rows.sort((a, b) => a.index - b.index);
  }, [input, selectedTab]);

  useEffect(() => {
    setFilteredRows(rows);
  }, [rows]);

  const onTabClick = (id: number) => {
    setSelectedTab(id);
  };

  // const onTabClick = (id: number) => {
  //   console.log(id);
  //   const rows = [];
  //   for (const item of flats) {
  //     if (id === 1) {
  //       rows.push(item);
  //     } else if (id === 2) {
  //       if (item.isRentDue) {
  //         rows.push(item);
  //       }
  //     } else if (id === 3) {
  //       if (!item.isOccupied) {
  //         rows.push(item);
  //       }
  //     }
  //     setFilteredRows(rows);
  //   }
  // }

  const getStatusIcon = (isOccupied: boolean, isRentDue: boolean) => {
    if (!isOccupied) {
      return (
        <TabBarMaterialIcon name={"bed-outline"} size={20} color={"#6b7280"} />
      );
    } else if (isRentDue) {
      return (
        <TabBarMaterialIcon
          name={"alert-outline"}
          size={20}
          color={"#6b7280"}
        />
      );
    }
    return (
      <TabBarMaterialIcon
        name={"checkbox-marked-circle-outline"}
        size={20}
        color={"#6b7280"}
      />
    );
  };
  const handleFlatClick = (id: number) => {
    console.log("Flat id:", id);
    router.push(`/flats/manage/${id}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.searchWrapper} id="searchwrapper">
          <ThemedView style={styles.search} id="search">
            <ThemedView style={styles.searchIcon}>
              <FeatherIcon name="search" size={17} />
            </ThemedView>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={(val) => setInput(val)}
              placeholder="Search by Tenant name or Flat No.."
              placeholderTextColor="#848484"
              returnKeyType="done"
              style={styles.searchControl}
              value={input}
            />
          </ThemedView>
        </ThemedView>
        <FlatListToggleButton tabs={tabs} onTabClick={onTabClick} />
        <ScrollView contentContainerStyle={styles.searchContent}>
          {filteredRows.length ? (
            filteredRows.map(
              (
                { id, img, name, flatDetails, isOccupied, isRentDue }: any,
                index: any,
              ) => {
                return (
                  <ThemedView key={index} style={styles.cardWrapper}>
                    <TouchableOpacity
                      onPress={() => {
                        // handle onPress
                        console.log("Pressed: flat id = ", name);
                        handleFlatClick(id);
                      }}
                    >
                      <ThemedView style={styles.card}>
                        {img ? (
                          <Image
                            alt=""
                            resizeMode="cover"
                            source={{ uri: img }}
                            style={styles.cardImg}
                          />
                        ) : (
                          <ThemedView
                            style={[styles.cardImg, styles.cardAvatar]}
                          >
                            <ThemedText style={styles.cardAvatarText}>
                              {name[0]}
                            </ThemedText>
                          </ThemedView>
                        )}

                        <ThemedView style={styles.cardBody}>
                          <ThemedText
                            darkColor="#fffff"
                            style={styles.cardTitle}
                          >
                            {name}
                          </ThemedText>

                          <ThemedText
                            darkColor="#fffff"
                            style={styles.cardPhone}
                          >
                            {flatDetails}
                          </ThemedText>
                        </ThemedView>

                        <ThemedView style={styles.cardAction}>
                          {getStatusIcon(isOccupied, isRentDue)}
                        </ThemedView>
                      </ThemedView>
                    </TouchableOpacity>
                  </ThemedView>
                );
              },
            )
          ) : (
            <ThemedText style={styles.searchEmpty}>No results</ThemedText>
          )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  /** Search */
  search: {
    position: "relative",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    backgroundColor: "#EBEDED",
  },
  searchWrapper: {
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: "auto",
    // borderBottomWidth: 1,
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: "transparent",
  },
  searchControl: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 34,
    width: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  searchContent: {
    paddingLeft: 24,
  },
  searchEmpty: {
    textAlign: "center",
    paddingTop: 16,
    fontWeight: "500",
    fontSize: 15,
    color: "#9ca1ac",
  },
  /** Card */
  card: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  cardWrapper: {
    borderBottomWidth: 1,
    borderColor: "#d6d6d6",
  },
  cardImg: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  cardAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9ca1ac",
  },
  cardAvatarText: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#fff",
  },
  cardBody: {
    marginRight: "auto",
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  cardPhone: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "#616d79",
    marginTop: 3,
  },
  cardAction: {
    paddingRight: 16,
  },
});
