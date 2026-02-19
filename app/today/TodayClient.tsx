"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase-browser";

type Quote = {
  quote: string;
  author: string;
};

export default function TodayClient() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    async function boot() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("quotes")
        .select("quote, author")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (data) {
        setQuote(data);
      }

      setLoading(false);
    }

    boot();
  }, [router, supabase]);

  const submitCheckin = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("Saving...");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setStatus("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ mood, note })
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to save check-in");
      if (res.status === 401) {
        router.push("/login");
      }
      return;
    }

    setStatus("Saved.");
    setNote("");
  };

  if (loading) {
    return <main>Loading...</main>;
  }

  return (
    <main>
      <h1>Mos Mood</h1>
      <AppNav />

      <div className="card">
        <h2>Today</h2>
        <p className="muted">Log how you feel right now.</p>
        <form onSubmit={submitCheckin}>
          <div className="field">
            <label htmlFor="mood">Mood (1-10)</label>
            <input
              id="mood"
              type="number"
              min={1}
              max={10}
              value={mood}
              onChange={(e) => setMood(Number(e.target.value))}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What shaped your mood today?"
            />
          </div>

          <button type="submit">Save check-in</button>
        </form>
        {status ? <p className="muted">{status}</p> : null}
      </div>

      <div className="card">
        <h2>Roman Quote</h2>
        {quote ? (
          <>
            <p>{quote.quote}</p>
            <p className="muted">- {quote.author}</p>
          </>
        ) : (
          <p className="muted">No active quote found yet.</p>
        )}
      </div>
    </main>
  );
}
