import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

export default function VerifyTOTPScreen() {
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { loadFactor(); }, []);

  async function loadFactor() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const { data } = await supabase.auth.mfa.listFactors();
    const totpFactor = data?.totp?.[0];
    if (!totpFactor) { router.replace("/setup-totp"); return; }

    setFactorId(totpFactor.id);
    setLoading(false);
  }

  async function handleVerify() {
    if (code.length !== 6) { setError("Please enter the 6-digit code."); return; }
    setError("");
    setVerifying(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) { setError("Challenge failed. Try again."); setVerifying(false); return; }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });

    if (verifyError) {
      setError("Invalid code. Check Microsoft Authenticator and try again.");
      setCode("");
      setVerifying(false);
      return;
    }

    router.replace("/");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inner}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.replace("/login")} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.logoWrap}>
          <Text style={{ fontSize: 28 }}>📱</Text>
        </View>
        <Text style={styles.title}>Two-Factor Auth</Text>
        <Text style={styles.subtitle}>
          Open Microsoft Authenticator and enter the 6-digit code
        </Text>

        {/* Card */}
        <View style={styles.card}>
          <TextInput
            style={styles.otpInput}
            value={code}
            onChangeText={(v) => {
              const clean = v.replace(/\D/g, "").slice(0, 6);
              setCode(clean);
              if (clean.length === 6) handleVerify();
            }}
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={colors.muted}
            maxLength={6}
            textAlign="center"
            autoFocus
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, (verifying || code.length < 6) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={verifying || code.length < 6}
            activeOpacity={0.85}
          >
            {verifying
              ? <ActivityIndicator color={colors.obsidian} />
              : <Text style={styles.btnText}>Verify & Sign In</Text>}
          </TouchableOpacity>

          <Text style={styles.hint}>Code refreshes every 30 seconds in the app</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.obsidian },
  center: { flex: 1, backgroundColor: colors.obsidian, alignItems: "center", justifyContent: "center" },
  inner: { flex: 1, justifyContent: "center", padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  backText: { color: colors.muted, fontSize: fontSize.sm },
  logoWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: "rgba(232,197,71,0.1)",
    borderWidth: 1, borderColor: "rgba(232,197,71,0.2)",
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.white, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: spacing.xl, lineHeight: 20 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.xl,
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.lg,
    color: colors.white, fontSize: 32,
    fontWeight: "600", letterSpacing: 10,
    marginBottom: spacing.md, fontFamily: "monospace",
  },
  errorBox: {
    backgroundColor: "rgba(255,71,87,0.1)", borderWidth: 1, borderColor: "rgba(255,71,87,0.3)",
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: "center" },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  btnDisabled: { backgroundColor: colors.muted },
  btnText: { color: colors.obsidian, fontWeight: "700", fontSize: fontSize.base },
  hint: { color: colors.muted, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.md },
});
