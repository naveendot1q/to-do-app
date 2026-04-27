"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2, Smartphone, ArrowLeft } from "lucide-react";

export default function VerifyTOTPPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [factorId, setFactorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadFactor();
  }, []);

  async function loadFactor() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data } = await supabase.auth.mfa.listFactors();
    const totpFactor = data?.totp?.[0];

    if (!totpFactor) {
      // Not enrolled — go to setup
      router.push("/setup-totp");
      return;
    }

    setFactorId(totpFactor.id);
    setLoading(false);
    setTimeout(() => inputs.current[0]?.focus(), 100);
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
    if (verifying || !factorId) return;
    setError("");
    setVerifying(true);

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) { setError("Challenge failed. Please try again."); setVerifying(false); return; }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: totpCode,
      });

      if (verifyError) {
        setError("Invalid code. Check Microsoft Authenticator and try again.");
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        setVerifying(false);
        return;
      }

      router.push("/");
    } catch {
      setError("Verification failed. Please try again.");
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-bg min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(232,197,71,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,197,71,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />

      <div className="glass rounded-2xl p-8 w-full max-w-md animate-slide-up" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}>
        <button onClick={() => router.push("/login")} className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-white" style={{ color: "var(--muted)" }}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: "rgba(232,197,71,0.1)", border: "1px solid rgba(232,197,71,0.2)" }}>
            <Smartphone size={24} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}>
            Two-Factor Auth
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Open Microsoft Authenticator and enter the 6-digit code
          </p>
        </div>

        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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
          {verifying ? <Loader2 size={18} className="animate-spin" /> : "Verify & Sign In"}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>
          Code refreshes every 30 seconds in the app
        </p>
      </div>
    </div>
  );
}
