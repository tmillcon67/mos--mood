"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [reminderTime, setReminderTime] = useState("09:00");
  const [timezone, setTimezone] = useState("America/New_York");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [quoteEnabled, setQuoteEnabled] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      setEmail(userData.user.email || "");
    }

    load();
  }, [router, supabase]);

  const saveSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reminderTime, timezone, emailEnabled, quoteEnabled })
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to save settings");
      return;
    }

    setStatus("Saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main>
      <h1>Mos Mood</h1>
      <AppNav />
      <div className="card">
        <h2>Settings</h2>
        <p className="muted">Signed in as {email}</p>

        <form onSubmit={saveSchedule}>
          <div className="field">
            <label htmlFor="reminderTime">Reminder time</label>
            <input
              id="reminderTime"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="timezone">Timezone</label>
            <input
              id="timezone"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="emailEnabled">Enable reminder emails</label>
            <select
              id="emailEnabled"
              value={emailEnabled ? "true" : "false"}
              onChange={(e) => setEmailEnabled(e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="quoteEnabled">Enable daily quote emails</label>
            <select
              id="quoteEnabled"
              value={quoteEnabled ? "true" : "false"}
              onChange={(e) => setQuoteEnabled(e.target.value === "true")}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <button type="submit">Save settings</button>
        </form>
        {status ? <p className="muted">{status}</p> : null}

        <button className="secondary" onClick={signOut} style={{ marginTop: "1rem" }}>
          Sign out
        </button>
      </div>
    </main>
  );
}
