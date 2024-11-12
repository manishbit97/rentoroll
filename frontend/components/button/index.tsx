import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  style?: any;
}

const ThemedButton: React.FC<ThemedButtonProps> = ({
  title = "button",
  onPress,
  size = "xl",
  children,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, styles[size], style]}
    >
      {children ? (
        children
      ) : (
        <Text style={[styles.buttonText, styles[`${size}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007bff",
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
  },
  xs: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  lg: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  xl: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  xsText: {
    fontSize: 12,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },
  xlText: {
    fontSize: 20,
  },
});

export default ThemedButton;
