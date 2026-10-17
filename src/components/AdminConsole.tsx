import React, { useCallback, useEffect, useState } from "react";
import { LogOut, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { AuthUser } from "./AuthScreen";

type ManagedUser = AuthUser & { createdAt: string };

export function AdminConsole({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "PLATFORM_ADMIN">("USER");
  const [hasLegacyWorkspace, setHasLegacyWorkspace] = useState(false);
  const [legacyUserId, setLegacyUserId] = useState("");

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load users.");
    setUsers(data);
  }, []);
  const loadLegacyStatus = useCallback(async () => {
    const response = await fetch("/api/admin/legacy-status");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to check the legacy workspace.");
    setHasLegacyWorkspace(Boolean(data.hasLegacyWorkspace));
  }, []);
  useEffect(() => { loadUsers().catch((reason) => setError(reason.message)); loadLegacyStatus().catch((reason) => setError(reason.message)); }, [loadUsers, loadLegacyStatus]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, role }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create user.");
      setUsers((previous) => [data, ...previous]); setName(""); setEmail(""); setPassword(""); setRole("USER");
    } catch (reason: any) { setError(reason.message); }
  };
  const updateUser = async (managedUser: ManagedUser, changes: Partial<Pick<ManagedUser, "isActive" | "role">>) => {
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${managedUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update user.");
      setUsers((previous) => previous.map((item) => item.id === data.id ? data : item));
    } catch (reason: any) { setError(reason.message); }
  };
  const assignLegacy = async () => {
    if (!legacyUserId) return;
    setError("");
    try {
      const response = await fetch("/api/admin/legacy/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: legacyUserId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to assign the legacy workspace.");
      setHasLegacyWorkspace(false);
    } catch (reason: any) { setError(reason.message); }
  };
  return <main className="min-h-screen bg-slate-950 text-slate-100 p-5 sm:p-8"><div className="mx-auto max-w-5xl"><header className="flex flex-wrap gap-4 items-center justify-between mb-8"><div><p className="text-emerald-400 text-sm font-semibold flex gap-2 items-center"><ShieldCheck className="w-4 h-4" /> Platform administration</p><h1 className="text-3xl font-bold mt-1">User access</h1><p className="text-slate-400 text-sm mt-1">Signed in as {user.name}. This console never exposes customer financial data.</p></div><button onClick={onLogout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-900"><LogOut className="w-4 h-4" /> Sign out</button></header>
    <div className="grid lg:grid-cols-[360px_1fr] gap-6"><div className="space-y-5"><form onSubmit={createUser} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 h-fit space-y-3"><h2 className="font-semibold flex gap-2 items-center"><UserPlus className="w-4 h-4 text-emerald-400" /> Add user</h2><input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5" /><input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5" /><input required minLength={10} type="password" placeholder="Temporary password (10+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5" /><label className="text-sm block">Role<select value={role} onChange={(e) => setRole(e.target.value as "USER" | "PLATFORM_ADMIN")} className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5"><option value="USER">Financial workspace user</option><option value="PLATFORM_ADMIN">Platform administrator</option></select></label><button className="w-full rounded-xl bg-emerald-400 text-slate-950 font-semibold py-2.5">Create account</button></form>{hasLegacyWorkspace && <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm"><h2 className="font-semibold text-amber-200">Assign legacy workspace</h2><p className="mt-2 text-amber-100/80">Pre-existing records are hidden until assigned to one financial user. This action does not display their contents.</p><select value={legacyUserId} onChange={(e) => setLegacyUserId(e.target.value)} className="mt-3 w-full rounded-xl bg-slate-950 border border-slate-700 p-2.5"><option value="">Choose a user</option>{users.filter((item) => item.role === "USER" && item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select><button onClick={assignLegacy} disabled={!legacyUserId} className="mt-3 w-full rounded-xl border border-amber-400/50 py-2 font-semibold text-amber-200 disabled:opacity-50">Assign safely</button></section>}</div>
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden"><div className="p-5 border-b border-slate-800 flex gap-2 items-center"><Users className="w-4 h-4 text-emerald-400" /><h2 className="font-semibold">Accounts ({users.length})</h2></div>{error && <p className="m-4 rounded-xl p-3 text-sm border border-rose-500/30 bg-rose-500/10 text-rose-300">{error}</p>}<div className="divide-y divide-slate-800">{users.map((item) => <div key={item.id} className="p-4 flex flex-wrap gap-3 items-center justify-between"><div><p className="font-medium">{item.name} {item.id === user.id && <span className="text-xs text-slate-500">(you)</span>}</p><p className="text-sm text-slate-400">{item.email}</p></div><div className="flex items-center gap-2"><select disabled={item.id === user.id} value={item.role} onChange={(e) => updateUser(item, { role: e.target.value as ManagedUser["role"] })} className="rounded-lg bg-slate-950 border border-slate-700 p-2 text-xs disabled:opacity-50"><option value="USER">User</option><option value="PLATFORM_ADMIN">Admin</option></select><button disabled={item.id === user.id} onClick={() => updateUser(item, { isActive: !item.isActive })} className={`rounded-lg border px-3 py-2 text-xs disabled:opacity-50 ${item.isActive ? "border-emerald-500/40 text-emerald-300" : "border-rose-500/40 text-rose-300"}`}>{item.isActive ? "Active" : "Disabled"}</button></div></div>)}</div></section></div>
  </div></main>;
}
