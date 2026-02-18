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
  const [emailTestStatus, setEmailTestStatus] = useState("");
  const [sendingCheckinTest, setSendingCheckinTest] = useState(false);
  const [sendingQuoteTest, setSendingQuoteTest] = useState(false);

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

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ reminderTime, timezone, emailEnabled, quoteEnabled })
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to save settings");
      if (res.status === 401) {
        router.push("/login");
      }
      return;
    }

    setStatus("Saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sendCheckinTestEmail = async () => {
    setSendingCheckinTest(true);
    setEmailTestStatus("Sending check-in reminder test email...");

    try {
      const res = await fetch("/api/email/checkin", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setEmailTestStatus(data.error || "Failed to send check-in reminder test email");
        if (res.status === 401) {
          router.push("/login");
        }
        return;
      }

      setEmailTestStatus("Check-in reminder test email sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send check-in reminder test email";
      setEmailTestStatus(message);
    } finally {
      setSendingCheckinTest(false);
    }
  };

  const sendQuoteTestEmail = async () => {
    setSendingQuoteTest(true);
    setEmailTestStatus("Sending quote test email...");

    try {
      const res = await fetch("/api/email/quote", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setEmailTestStatus(data.error || "Failed to send quote test email");
        if (res.status === 401) {
          router.push("/login");
        }
        return;
      }

      setEmailTestStatus("Quote test email sent.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send quote test email";
      setEmailTestStatus(message);
    } finally {
      setSendingQuoteTest(false);
    }
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

        <div className="field" style={{ marginTop: "1rem" }}>
          <button type="button" onClick={sendCheckinTestEmail} disabled={sendingCheckinTest || sendingQuoteTest}>
            {sendingCheckinTest ? "Sending..." : "Send check-in reminder test email"}
          </button>
        </div>

        <div className="field">
          <button
            type="button"
            onClick={sendQuoteTestEmail}
            className="secondary"
            disabled={sendingCheckinTest || sendingQuoteTest}
          >
            {sendingQuoteTest ? "Sending..." : "Send quote test email"}
          </button>
        </div>

        {emailTestStatus ? <p className="muted">{emailTestStatus}</p> : null}

        <button className="secondary" onClick={signOut} style={{ marginTop: "1rem" }}>
          Sign out
        </button>
      </div>
    </main>
  );
}
