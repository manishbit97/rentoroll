import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

function AlertDialogContent({
  children,
  ...props
}: AlertDialogPrimitive.ContentProps) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay asChild>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.overlay}
        >
          <AlertDialogPrimitive.Content style={styles.content} {...props}>
            {children}
          </AlertDialogPrimitive.Content>
        </Animated.View>
      </AlertDialogPrimitive.Overlay>
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}

function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

function AlertDialogTitle({ children }: AlertDialogPrimitive.TitleProps) {
  return (
    <AlertDialogPrimitive.Title>
      <Text style={styles.title}>{children}</Text>
    </AlertDialogPrimitive.Title>
  );
}

function AlertDialogDescription({
  children,
}: AlertDialogPrimitive.DescriptionProps) {
  return (
    <AlertDialogPrimitive.Description>
      <Text style={styles.description}>{children}</Text>
    </AlertDialogPrimitive.Description>
  );
}

function AlertDialogAction({
  children,
  destructive = false,
  onPress,
  ...props
}: AlertDialogPrimitive.ActionProps & { destructive?: boolean }) {
  return (
    <AlertDialogPrimitive.Action asChild {...props}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionBtn,
          destructive && styles.destructiveBtn,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.actionText}>{children as string}</Text>
      </Pressable>
    </AlertDialogPrimitive.Action>
  );
}

function AlertDialogCancel({
  children,
  onPress,
  ...props
}: AlertDialogPrimitive.CancelProps) {
  return (
    <AlertDialogPrimitive.Cancel asChild {...props}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
      >
        <Text style={styles.cancelText}>{children as string}</Text>
      </Pressable>
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: { marginBottom: 4 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 6 },
  description: { fontSize: 14, color: "#6b7280", lineHeight: 21 },
  actionBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  destructiveBtn: { backgroundColor: "#ef4444" },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cancelBtn: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelText: { color: "#374151", fontSize: 14, fontWeight: "500" },
  pressed: { opacity: 0.75 },
});
