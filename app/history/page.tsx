"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";

type Checkin = {
  id: string;
  mood: number;
  note: string | null;
  checkin_at: string;
};

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/checkins");

      if (res.ok) {
        const data = await res.json();
        setItems(data.checkins || []);
      } else if (res.status === 401) {
        router.push("/login");
      }

      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <main>
      <h1>Mos Mood</h1>
      <AppNav />
      <div className="card">
        <h2>History</h2>
        {loading ? <p>Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="muted">No check-ins yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="card">
            <strong>Mood: {item.mood}/10</strong>
            <p>{item.note || "No note"}</p>
            <p className="muted">{new Date(item.checkin_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
