import { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Image, Alert, Clipboard,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

export default function SetupTOTPScreen() {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { setupMFA(); }, []);

  async function setupMFA() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === "aal2") { router.replace("/"); return; }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "My Todo App",
      friendlyName: "Microsoft Authenticator",
    });

    if (error || !data) {
      Alert.alert("Error", "Failed to set up 2FA. Please try again.");
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
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
      setError("Invalid code. Check your authenticator and try again.");
      setCode("");
      setVerifying(false);
      return;
    }

    router.replace("/");
  }

  function copySecret() {
    Clipboard.setString(secret);
    Alert.alert("Copied!", "Secret key copied to clipboard.");
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Setting up 2FA...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.logoWrap}>
        <Text style={{ fontSize: 28 }}>🛡️</Text>
      </View>
      <Text style={styles.title}>Set Up 2FA</Text>
      <Text style={styles.subtitle}>Scan with Microsoft Authenticator</Text>

      {/* Steps */}
      <View style={styles.card}>
        {[
          "Open Microsoft Authenticator on your phone",
          'Tap "+" → "Other account"',
          "Scan the QR code below",
          "Enter the 6-digit code from the app",
        ].map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* QR Code */}
      {qrCode ? (
        <View style={styles.qrWrap}>
          <View style={styles.qrBox}>
            <Image source={{ uri: qrCode }} style={{ width: 180, height: 180 }} resizeMode="contain" />
          </View>
          <TouchableOpacity style={styles.secretBox} onPress={copySecret} activeOpacity={0.7}>
            <Text style={styles.secretLabel}>Can't scan? Tap to copy key:</Text>
            <Text style={styles.secretText} numberOfLines={2}>{secret}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Code input */}
      <View style={styles.card}>
        <Text style={styles.label}>Enter the 6-digit code from the app</Text>
        <TextInput
          style={styles.otpInput}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          placeholder="000000"
          placeholderTextColor={colors.muted}
          maxLength={6}
          textAlign="center"
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
            : <Text style={styles.btnText}>Activate 2FA & Continue</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.obsidian },
  scroll: { padding: spacing.xl, paddingBottom: 60 },
  center: { flex: 1, backgroundColor: colors.obsidian, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, marginTop: spacing.md, fontSize: fontSize.sm },
  logoWrap: {
    width: 64, height: 64, borderRadius: radius.lg,
    backgroundColor: "rgba(232,197,71,0.1)",
    borderWidth: 1, borderColor: "rgba(232,197,71,0.2)",
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: spacing.md,
  },
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.white, textAlign: "center" },
  subtitle: { fontSize: fontSize.sm, color: colors.muted, textAlign: "center", marginTop: 4, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  step: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.sm, gap: spacing.sm },
  stepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(232,197,71,0.15)", alignItems: "center", justifyContent: "center",
  },
  stepNumText: { color: colors.accent, fontSize: fontSize.xs, fontWeight: "700" },
  stepText: { color: colors.muted, fontSize: fontSize.sm, flex: 1, lineHeight: 20 },
  qrWrap: { alignItems: "center", marginBottom: spacing.lg },
  qrBox: { backgroundColor: "#fff", borderRadius: radius.md, padding: 12, marginBottom: spacing.md },
  secretBox: {
    backgroundColor: colors.surface, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, width: "100%",
  },
  secretLabel: { color: colors.muted, fontSize: fontSize.xs, marginBottom: 4 },
  secretText: { color: colors.accent, fontSize: fontSize.xs, fontFamily: "monospace" },
  label: { color: colors.muted, fontSize: fontSize.sm, marginBottom: spacing.sm },
  otpInput: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: "600",
    letterSpacing: 8,
    marginBottom: spacing.md,
    fontFamily: "monospace",
  },
  errorBox: {
    backgroundColor: "rgba(255,71,87,0.1)", borderWidth: 1, borderColor: "rgba(255,71,87,0.3)",
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: "center" },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  btnDisabled: { backgroundColor: colors.muted },
  btnText: { color: colors.obsidian, fontWeight: "700", fontSize: fontSize.base },
});
