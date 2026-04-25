import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
      router.replace("/verify-totp");
    } else {
      router.replace("/setup-totp");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>✦</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Your private workspace awaits</Text>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoComplete="password"
            onSubmitEditing={handleLogin}
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color={colors.obsidian} />
              : <Text style={styles.btnText}>Continue →</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>🔐 Protected by Microsoft Authenticator (TOTP)</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.obsidian },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  logoWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: "rgba(232,197,71,0.1)",
    borderWidth: 1, borderColor: "rgba(232,197,71,0.2)",
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: spacing.lg,
  },
  logoIcon: { fontSize: 28, color: colors.accent },
  title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.white, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: spacing.xl },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl,
  },
  label: { fontSize: fontSize.sm, color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.soft,
    fontSize: fontSize.base,
  },
  errorBox: {
    marginTop: spacing.md,
    backgroundColor: "rgba(255,71,87,0.1)",
    borderWidth: 1, borderColor: "rgba(255,71,87,0.3)",
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  btnText: { color: colors.obsidian, fontWeight: "700", fontSize: fontSize.base },
  footer: { color: colors.muted, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.xl },
});
