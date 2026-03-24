import React from "react";
import { View, Text } from "react-native";

const COLORS = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed"];

interface Props {
  name: string;
  size?: number;
}

export default function InitialsAvatar({ name, size = 40 }: Props) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + "22",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: "700", color }}>
        {initials}
      </Text>
    </View>
  );
}
