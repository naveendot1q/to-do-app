"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, ShieldCheck, Copy, Check } from "lucide-react";

export default function SetupTOTPPage() {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setupMFA();
  }, []);

  async function setupMFA() {
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      // Check if already enrolled
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.currentLevel === "aal2") { router.push("/"); return; }

      // Enroll TOTP
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "My Todo App",
        friendlyName: "Microsoft Authenticator",
      });

      if (error || !data) {
        setError("Failed to set up 2FA. Please try again.");
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);

      setTimeout(() => inputs.current[0]?.focus(), 100);
    } catch {
      setError("Something went wrong. Please refresh.");
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      handleVerify(pasted);
    }
  }

  async function handleVerify(totpCode: string) {
    if (verifying) return;
    setError("");
    setVerifying(true);

    try {
      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) { setError("Challenge failed. Please try again."); setVerifying(false); return; }

      // Verify code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode,
      });

      if (verifyError) {
        setError("Invalid code. Check your authenticator and try again.");
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      // Success — 2FA is now set up!
      router.push("/");
    } catch {
      setError("Verification failed. Please try again.");
      setVerifying(false);
    }
  }

  async function copySecret() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
          <p style={{ color: "var(--muted)" }}>Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(232,197,71,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,197,71,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div className="glass rounded-2xl p-8 w-full max-w-md animate-slide-up" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: "rgba(232,197,71,0.1)", border: "1px solid rgba(232,197,71,0.2)" }}>
            <ShieldCheck size={24} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}>
            Set Up 2FA
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Scan the QR code with Microsoft Authenticator
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-6">
          {[
            "Open Microsoft Authenticator on your phone",
            'Tap "+" → "Other account (Google, Facebook, etc.)"',
            "Scan the QR code below",
            "Enter the 6-digit code from the app",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--muted)" }}>
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(232,197,71,0.15)", color: "var(--accent)" }}>
                {i + 1}
              </span>
              {step}
            </div>
          ))}
        </div>

        {/* QR Code */}
        {qrCode && (
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 rounded-xl" style={{ background: "#fff" }}>
              <img src={qrCode} alt="TOTP QR Code" width={160} height={160} />
            </div>

            {/* Manual secret */}
            <div className="mt-3 w-full">
              <p className="text-xs text-center mb-2" style={{ color: "var(--muted)" }}>
                Can't scan? Enter this key manually:
              </p>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(10,10,15,0.8)", border: "1px solid var(--border)" }}>
                <code className="flex-1 text-xs break-all" style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {secret}
                </code>
                <button onClick={copySecret} className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-white/5" style={{ color: copied ? "var(--success)" : "var(--muted)" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OTP Entry */}
        <div>
          <p className="text-sm text-center mb-3" style={{ color: "var(--soft)" }}>
            Enter the 6-digit code from Microsoft Authenticator
          </p>
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="otp-input"
                maxLength={1}
                disabled={verifying}
              />
            ))}
          </div>

          {error && (
            <div className="rounded-lg p-3 text-sm mb-4 text-center animate-fade-in" style={{ background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <button
            onClick={() => handleVerify(code.join(""))}
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={verifying || code.join("").length < 6}
          >
            {verifying ? <Loader2 size={18} className="animate-spin" /> : "Activate 2FA & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
