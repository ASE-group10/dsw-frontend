import { ToastAndroid, Platform, Alert } from "react-native"

export function devAlert(message: string) {
  if (__DEV__) {
    // In development, log to console
    console.log(message)
  } else {
    // In production, show on-screen
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG)
    } else {
      Alert.alert("Log", message)
    }
  }
}
