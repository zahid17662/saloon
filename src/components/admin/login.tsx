"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAdmin, useStore } from "@/lib/store";
import { Button, ErrorText } from "../ui";
import { LockIcon } from "../icons";

export function AdminLogin() {
  const s = useStore();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginAdmin(pin)) {
      setError("পিন ভুল হয়েছে");
      setPin("");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/admin") && next !== "/admin/login" ? next : "/admin");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <LockIcon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-fg">এডমিন লগইন</h1>
        <p className="mt-1 text-sm text-muted">{s?.db.settings.shopName}</p>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          autoFocus
          aria-label="এডমিন পিন"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError("");
          }}
          className="mt-6 h-14 w-full rounded-2xl border border-line-strong bg-surface-2 text-center text-2xl tracking-[0.5em] text-fg focus:border-primary focus:outline-none"
        />
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
        <Button type="submit" size="lg" className="mt-4 w-full" disabled={!pin || !s}>
          লগইন
        </Button>
        <p className="mt-4 text-xs text-subtle">ডেমো পিন: ০০০০</p>
        <Link href="/" className="mt-2 inline-block text-sm text-primary hover:underline">
          নাপিতের স্ক্রিনে যান
        </Link>
      </form>
    </main>
  );
}
