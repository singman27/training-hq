import { useState } from 'react';
import { supabase } from './supabaseClient';

const S = {
  bg: "#060606", card: "#0c0c0c", bd: "#181818", tx: "#e4e4e4",
  dm: "#555", ac: "#10b981", fn: "'Outfit', sans-serif"
};

const inp = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 8, border: `1px solid ${S.bd}`, background: "#0f0f0f",
  color: S.tx, fontSize: 15, fontFamily: S.fn, outline: "none"
};

export default function Auth() {
  const [mode, setMode] = useState("magic"); // "magic" | "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setLoading(false);
    if (error) setError(error.message);
    else setMessage("Check your email for the login link.");
  };

  const handleEmailPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin }
      });
      setLoading(false);
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) setError(error.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: S.fn, padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${S.ac}, #e4e4e4)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TRAINING HQ
          </div>
          <div style={{ fontSize: 13, color: S.dm, marginTop: 6 }}>Masters athlete performance system</div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          {[["magic", "Magic Link"], ["login", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
                background: mode === m ? S.ac + "15" : "transparent",
                color: mode === m ? S.ac : S.dm,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 1
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: S.card, border: `1px solid ${S.bd}`, borderRadius: 14, padding: 24 }}>
          {mode === "magic" ? (
            <div>
              <div style={{ fontSize: 14, color: S.tx, marginBottom: 4, fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 11, color: S.dm, marginBottom: 14 }}>We'll send you a login link — no password needed.</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" style={{ ...inp, marginBottom: 16 }}
                onKeyDown={e => e.key === "Enter" && handleMagicLink(e)} />
              <button onClick={handleMagicLink} disabled={loading || !email}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
                  background: loading || !email ? S.bd : S.ac,
                  color: loading || !email ? S.dm : "#000",
                  fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer"
                }}>
                {loading ? "Sending..." : "Send Magic Link"}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 14, color: S.tx, marginBottom: 14, fontWeight: 600 }}>
                {mode === "signup" ? "Create your account" : "Sign in to your account"}
              </div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" style={{ ...inp, marginBottom: 10 }} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Choose a password (6+ chars)" : "Password"}
                style={{ ...inp, marginBottom: 16 }}
                onKeyDown={e => e.key === "Enter" && handleEmailPassword(e)} />
              <button onClick={handleEmailPassword} disabled={loading || !email || !password}
                style={{
                  width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
                  background: loading || !email || !password ? S.bd : S.ac,
                  color: loading || !email || !password ? S.dm : "#000",
                  fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer"
                }}>
                {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </div>
          )}

          {/* Messages */}
          {message && (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: S.ac + "12", border: `1px solid ${S.ac}30`, fontSize: 12, color: S.ac }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, background: "#ef444412", border: "1px solid #ef444430", fontSize: 12, color: "#ef4444" }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "#333" }}>
          Your data is encrypted and synced securely via Supabase.
        </div>
      </div>
    </div>
  );
}
