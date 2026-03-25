import { toast } from "sonner-native";

export const showError = (message: string) => toast.error(message);
export const showSuccess = (message: string) => toast.success(message);
export const showInfo = (message: string) => toast(message);

/** Legacy compat — maps old showAlert calls to the right toast type. */
export function showAlert(title: string, message?: string) {
  const text = message ?? title;
  const isError =
    title.toLowerCase().startsWith("error") ||
    title.toLowerCase().startsWith("save first");
  if (isError) {
    toast.error(text);
  } else {
    toast.success(text);
  }
}
