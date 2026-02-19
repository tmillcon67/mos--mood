"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { createClient } from "@/lib/supabase-browser";

type Checkin = {
  mood: number;
  checkin_at: string;
};

export default function ReportsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<Checkin[]>([]);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/checkins", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.checkins || []);
      } else if (res.status === 401) {
        router.push("/login");
      }
    }

    load();
  }, [router, supabase]);

  const avgMood = useMemo(() => {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + item.mood, 0) / items.length;
  }, [items]);

  const thisWeekCount = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return items.filter((item) => new Date(item.checkin_at).getTime() >= weekAgo).length;
  }, [items]);

  return (
    <main>
      <h1>Mos Mood</h1>
      <AppNav />
      <div className="card">
        <h2>Reports</h2>
        <p>
          Average mood: <strong>{avgMood.toFixed(2)}</strong>
        </p>
        <p>
          Check-ins in last 7 days: <strong>{thisWeekCount}</strong>
        </p>
        <p className="muted">This is a basic v1 summary report.</p>
      </div>
    </main>
  );
}
