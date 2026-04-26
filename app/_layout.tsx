import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Small delay to let router fully mount before navigating
    const timer = setTimeout(() => {
      checkAuth();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
        router.replace("/verify-totp");
      } else if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal1") {
        router.replace("/setup-totp");
      } else {
        router.replace("/");
      }
    } catch (e) {
      router.replace("/login");
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.obsidian }}>
      <StatusBar style="light" backgroundColor={colors.obsidian} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.obsidian },
          animation: "fade",
        }}
      />
    </GestureHandlerRootView>
  );
}
