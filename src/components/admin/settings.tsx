"use client";

import { useState } from "react";
import { useLiveStore } from "../gates";
import { Button, Card, ErrorText, Field, PageTitle, Select } from "../ui";
import { errMsg } from "./common";
import { changeAdminPin, changeShopCode } from "@/app/actions/auth";
import { exportAll, resetDemoData, updateSettings } from "@/lib/store";
import { downloadFile } from "@/lib/reports";
import { todayKey } from "@/lib/time";
import type { PaperWidth } from "@/lib/types";

function Saved({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="text-sm text-success">
      সেভ হয়েছে ✓
    </p>
  );
}

export function SettingsPage() {
  return (
    <>
      <PageTitle title="সেটিংস" />
      <div className="grid gap-4 lg:grid-cols-2">
        <ShopInfo />
        <div className="space-y-4">
          <PinForm />
          <ShopCodeForm />
          <DataTools />
        </div>
      </div>
    </>
  );
}

function ShopInfo() {
  const { db } = useLiveStore();
  const [form, setForm] = useState({
    shopName: db.settings.shopName,
    shopAddress: db.settings.shopAddress,
    shopPhone: db.settings.shopPhone,
    receiptFooter: db.settings.receiptFooter,
    paperWidth: db.settings.paperWidth,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [k]: e.target.value });
    setSaved(false);
  };

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-fg">দোকান ও রসিদ</h2>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            updateSettings(form);
            setError("");
            setSaved(true);
          } catch (err) {
            setError(errMsg(err));
          }
        }}
      >
        <Field label="দোকানের নাম" value={form.shopName} onChange={set("shopName")} required />
        <Field label="ঠিকানা" value={form.shopAddress} onChange={set("shopAddress")} />
        <Field label="ফোন" inputMode="tel" value={form.shopPhone} onChange={set("shopPhone")} />
        <Field label="রসিদের নিচের লেখা" value={form.receiptFooter} onChange={set("receiptFooter")} />
        <Select label="রসিদের কাগজ" value={form.paperWidth} onChange={set("paperWidth")}>
          {(["58", "80", "A4"] as PaperWidth[]).map((p) => (
            <option key={p} value={p}>
              {p === "A4" ? "A4" : `${p} মিমি থার্মাল`}
            </option>
          ))}
        </Select>
        <ErrorText>{error}</ErrorText>
        <Saved show={saved} />
        <Button type="submit">সেভ করুন</Button>
      </form>
    </Card>
  );
}

function PinForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-fg">এডমিন পিন পরিবর্তন</h2>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved(false);
          if (next !== confirm) return setError("নতুন পিন দুইবার একই হয়নি");
          const r = await changeAdminPin({ current, next });
          if (!r.ok) return setError(r.error);
          setError("");
          setSaved(true);
          setCurrent("");
          setNext("");
          setConfirm("");
        }}
      >
        <Field label="বর্তমান পিন" type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="নতুন পিন" type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value)} required />
          <Field label="আবার লিখুন" type="password" inputMode="numeric" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <ErrorText>{error}</ErrorText>
        <Saved show={saved} />
        <Button type="submit" variant="secondary">
          পিন বদলান
        </Button>
      </form>
    </Card>
  );
}

function ShopCodeForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-fg">দোকানের কোড পরিবর্তন</h2>
      <p className="mb-4 text-sm text-muted">কোড বদলালে দোকানের সব ফোন/কম্পিউটারে আবার নতুন কোড দিতে হবে।</p>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved(false);
          if (!window.confirm("সব ডিভাইস থেকে লগআউট হবে। কোড বদলাবেন?")) return;
          const r = await changeShopCode({ next: code });
          if (!r.ok) return setError(r.error);
          setError("");
          setSaved(true);
          setCode("");
        }}
      >
        <Field label="নতুন কোড (৪–৮ সংখ্যা)" type="password" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} required />
        <ErrorText>{error}</ErrorText>
        <Saved show={saved} />
        <Button type="submit" variant="secondary">
          কোড বদলান
        </Button>
      </form>
    </Card>
  );
}

function DataTools() {
  const [error, setError] = useState("");
  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-fg">ডেটা</h2>
      <p className="mb-4 text-sm text-muted">সব হিসাবের একটি কপি ডাউনলোড করে রাখুন।</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            try {
              downloadFile(`salon-backup-${todayKey()}.json`, exportAll(), "application/json");
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          ব্যাকআপ ডাউনলোড
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!window.confirm("সব বিক্রি, পেমেন্ট ও পরিবর্তন মুছে শুরুর ডেমো ডেটায় ফিরে যাবে। নিশ্চিত?")) return;
            try {
              resetDemoData();
            } catch (err) {
              setError(errMsg(err));
            }
          }}
        >
          ডেমো ডেটা রিসেট
        </Button>
      </div>
      <div className="mt-3">
        <ErrorText>{error}</ErrorText>
      </div>
    </Card>
  );
}
