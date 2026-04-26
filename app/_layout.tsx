import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0a0a0f" }}>
      <StatusBar style="light" backgroundColor="#0a0a0f" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0a0a0f" } }} />
    </GestureHandlerRootView>
  );
}
