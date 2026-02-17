"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Magic link sent. Check your email.");
    }

    setLoading(false);
  };

  return (
    <main>
      <h1>Mos Mood</h1>
      <div className="card">
        <h2>Login</h2>
        <p className="muted">Enter your email to receive a magic link.</p>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {message ? <p className="muted">{message}</p> : null}
      </div>
    </main>
  );
}
