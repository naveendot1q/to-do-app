import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login");
          return;
        }
        const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (data?.nextLevel === "aal2" && data?.currentLevel !== "aal2") {
          router.replace("/verify-totp");
        } else if (data?.currentLevel === "aal1" && data?.nextLevel === "aal1") {
          router.replace("/setup-totp");
        } else {
          router.replace("/dashboard");
        }
      } catch {
        router.replace("/login");
      }
    }, 500);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>✦</Text>
      <Text style={styles.title}>My Todo</Text>
      <ActivityIndicator color="#e8c547" style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f", alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 48, color: "#e8c547" },
  title: { fontSize: 28, fontWeight: "700", color: "#fff", marginTop: 12 },
});
