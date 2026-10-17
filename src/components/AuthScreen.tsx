import React, { useEffect, useState } from "react";
import { LockKeyhole, Wallet } from "lucide-react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "PLATFORM_ADMIN" | "USER";
  isActive: boolean;
};

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [needsInitialAdmin, setNeedsInitialAdmin] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/bootstrap-status")
      .then((response) => response.json())
      .then((data) => {
        setNeedsInitialAdmin(Boolean(data.needsInitialAdmin));
        if (data.needsInitialAdmin) setMode("register");
      })
      .catch(() => setError("Unable to connect to the service."));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to continue.");
      onAuthenticated(data.user);
    } catch (reason: any) {
      setError(reason.message || "Unable to continue.");
    } finally {
      setBusy(false);
    }
  };

  const isBootstrap = needsInitialAdmin && mode === "register";
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-5">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-emerald-950/30">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-slate-950 grid place-items-center"><Wallet className="w-6 h-6" /></div>
          <div><h1 className="font-bold text-xl">Altrack</h1><p className="text-xs text-slate-400">Private personal finance</p></div>
        </div>
        <div className="mb-6">
          <h2 className="font-semibold text-lg">{isBootstrap ? "Set up the platform administrator" : mode === "login" ? "Welcome back" : "Create your private workspace"}</h2>
          <p className="text-sm text-slate-400 mt-1">{isBootstrap ? "This account manages user access only and cannot view financial records." : mode === "login" ? "Sign in to your own financial workspace." : "Your records remain isolated from every other account."}</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {mode === "register" && <label className="block text-sm">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-emerald-400" /></label>}
          <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-emerald-400" /></label>
          <label className="block text-sm">Password<input required type="password" minLength={10} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none focus:border-emerald-400" />{mode === "register" && <span className="mt-1 block text-xs text-slate-500">Use at least 10 characters.</span>}</label>
          {error && <p role="alert" className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-sm text-rose-300">{error}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-emerald-400 py-2.5 font-semibold text-slate-950 disabled:opacity-60">{busy ? "Please wait…" : mode === "login" ? "Sign in" : isBootstrap ? "Create administrator" : "Create account"}</button>
        </form>
        {!needsInitialAdmin && <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} className="w-full mt-5 text-sm text-emerald-400 hover:text-emerald-300">{mode === "login" ? "New here? Create your workspace" : "Already have an account? Sign in"}</button>}
        <div className="mt-6 flex gap-2 text-xs text-slate-500"><LockKeyhole className="w-4 h-4 shrink-0" />Sessions are stored in a secure, HTTP-only cookie. Keep your password private.</div>
      </section>
    </main>
  );
}
