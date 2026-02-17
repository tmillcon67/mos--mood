"use client";

import Link from "next/link";

export default function AppNav() {
  return (
    <nav>
      <Link href="/today">Today</Link>
      <Link href="/history">History</Link>
      <Link href="/reports">Reports</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
