import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useTheme } from "@/contexts/ThemeContext";
import { AppColors } from "@/theme/colors";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

function AlertDialogContent({
  children,
  ...props
}: AlertDialogPrimitive.ContentProps) {
  const { colors } = useTheme();
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay asChild>
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[styles.overlay]}
        >
          <AlertDialogPrimitive.Content
            style={StyleSheet.flatten([
              styles.content,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
              },
            ])}
            {...props}
          >
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
  const { colors } = useTheme();
  return (
    <AlertDialogPrimitive.Title>
      <Text style={[styles.title, { color: colors.text }]}>{children}</Text>
    </AlertDialogPrimitive.Title>
  );
}

function AlertDialogDescription({
  children,
}: AlertDialogPrimitive.DescriptionProps) {
  const { colors } = useTheme();
  return (
    <AlertDialogPrimitive.Description>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {children}
      </Text>
    </AlertDialogPrimitive.Description>
  );
}

function AlertDialogAction({
  children,
  destructive = false,
  onPress,
  ...props
}: AlertDialogPrimitive.ActionProps & { destructive?: boolean }) {
  const { colors } = useTheme();
  return (
    <AlertDialogPrimitive.Action asChild {...props}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionBtn,
          { backgroundColor: destructive ? colors.danger : colors.primary },
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
  const { colors } = useTheme();
  return (
    <AlertDialogPrimitive.Cancel asChild {...props}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cancelBtn,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.cancelText, { color: colors.textBody }]}>
          {children as string}
        </Text>
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
  title: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 21 },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cancelBtn: {
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontWeight: "500" },
  pressed: { opacity: 0.75 },
});
