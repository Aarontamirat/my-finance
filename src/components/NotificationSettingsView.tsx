import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, Mail, ShieldCheck } from "lucide-react";

type Preferences = { email: string; emailNotifications: boolean; emailDeliveryConfigured: boolean };

export function NotificationSettingsView() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((response) => response.json().then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (!response.ok) throw new Error(data.error || "Unable to load notification settings.");
        setPreferences(data);
      })
      .catch((reason) => setMessage(reason.message));
  }, []);

  const setEnabled = async (emailNotifications: boolean) => {
    if (!preferences) return;
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailNotifications }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save preferences.");
      setPreferences(data);
      setMessage(emailNotifications ? "Email notifications enabled." : "Email notifications disabled.");
    } catch (reason: any) { setMessage(reason.message || "Unable to save preferences."); }
    finally { setSaving(false); }
  };

  return <div className="max-w-2xl mx-auto space-y-6"><section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"><div className="flex gap-3"><div className="rounded-xl bg-emerald-500/10 text-emerald-500 p-3 h-fit"><Bell className="w-5 h-5" /></div><div><h1 className="text-xl font-bold">Notifications</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose whether Altrack may send important updates to your registered email.</p></div></div></section>{preferences && <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"><div className="flex gap-3"><Mail className="w-5 h-5 mt-0.5 text-slate-400" /><div><h2 className="font-semibold">Email alerts</h2><p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Sent to {preferences.email}. Budget alerts are sent once at 80% and once when a monthly category budget is reached.</p></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-4"><div><p className="font-medium text-sm">{preferences.emailNotifications ? "Enabled" : "Disabled"}</p><p className="text-xs text-slate-500 mt-0.5">{preferences.emailDeliveryConfigured ? "Email delivery is configured." : "Delivery will begin once the administrator configures SMTP."}</p></div><button disabled={saving} onClick={() => setEnabled(!preferences.emailNotifications)} className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60 ${preferences.emailNotifications ? "border border-slate-300 dark:border-slate-700" : "bg-emerald-400 text-slate-950"}`}>{saving ? "Saving…" : preferences.emailNotifications ? "Turn off" : "Turn on"}</button></div></section>}<section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-sm text-slate-500 dark:text-slate-400 flex gap-3"><ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" /><p>Only your own email address is used. Administrators manage access but do not receive your financial notification content.</p></section>{message && <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{message}</p>}</div>;
}
