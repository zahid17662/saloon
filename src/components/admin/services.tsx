"use client";

import { useState } from "react";
import { useLiveStore } from "../gates";
import { Badge, Button, Card, ErrorText, Field, Modal, PageTitle, Select, Toggle } from "../ui";
import { PlusIcon } from "../icons";
import { errMsg } from "./common";
import { addCategory, addService, updateCategory, updateService } from "@/lib/store";
import { bnDigits, parseIntInput, taka } from "@/lib/money";
import type { Category, Service } from "@/lib/types";

type Editing =
  | { kind: "category"; category: Category | null }
  | { kind: "service"; service: Service | null; categoryId: number }
  | null;

export function Services() {
  const s = useLiveStore();
  const [editing, setEditing] = useState<Editing>(null);
  const categories = [...s.db.categories].sort((a, z) => a.sortOrder - z.sortOrder);

  return (
    <>
      <PageTitle
        title="সার্ভিস ও দাম"
        sub={`${bnDigits(s.db.services.filter((x) => x.active).length)}টি সক্রিয় সার্ভিস`}
        actions={
          <Button variant="secondary" onClick={() => setEditing({ kind: "category", category: null })}>
            <PlusIcon className="h-5 w-5" />
            নতুন ক্যাটাগরি
          </Button>
        }
      />

      <div className="space-y-4">
        {categories.map((cat) => {
          const list = s.db.services.filter((x) => x.categoryId === cat.id).sort((a, z) => a.sortOrder - z.sortOrder);
          return (
            <Card key={cat.id} className={cat.active ? "" : "opacity-60"}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="flex-1 text-lg font-semibold text-primary">
                  {cat.name} {!cat.active && <Badge>নিষ্ক্রিয়</Badge>}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setEditing({ kind: "category", category: cat })}>
                  এডিট
                </Button>
                <Button size="sm" onClick={() => setEditing({ kind: "service", service: null, categoryId: cat.id })}>
                  <PlusIcon className="h-4 w-4" />
                  সার্ভিস
                </Button>
              </div>
              {list.length === 0 ? (
                <p className="py-3 text-sm text-subtle">এই ক্যাটাগরিতে কোনো সার্ভিস নেই</p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((svc) => (
                    <li key={svc.id} className="flex items-center gap-3 py-2.5">
                      <span className={svc.active ? "flex-1 text-fg" : "flex-1 text-subtle line-through"}>{svc.name}</span>
                      {!svc.active && <Badge>নিষ্ক্রিয়</Badge>}
                      <span className="w-20 text-right font-semibold tabular-nums">{taka(svc.price)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing({ kind: "service", service: svc, categoryId: svc.categoryId })}
                      >
                        এডিট
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>

      <Modal
        open={editing !== null}
        title={
          editing?.kind === "category"
            ? editing.category
              ? "ক্যাটাগরি এডিট"
              : "নতুন ক্যাটাগরি"
            : editing?.service
              ? "সার্ভিস এডিট"
              : "নতুন সার্ভিস"
        }
        onClose={() => setEditing(null)}
      >
        {editing?.kind === "category" && (
          <CategoryForm key={editing.category?.id ?? "new"} category={editing.category} onDone={() => setEditing(null)} />
        )}
        {editing?.kind === "service" && (
          <ServiceForm
            key={editing.service?.id ?? `new-${editing.categoryId}`}
            service={editing.service}
            categoryId={editing.categoryId}
            categories={categories}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [order, setOrder] = useState(String(category?.sortOrder ?? ""));
  const [active, setActive] = useState(category?.active ?? true);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (category) {
            updateCategory(category.id, { name: name.trim(), sortOrder: parseIntInput(order) ?? category.sortOrder, active });
          } else addCategory(name);
          onDone();
        } catch (err) {
          setError(errMsg(err));
        }
      }}
    >
      <Field label="ক্যাটাগরির নাম" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      {category && (
        <>
          <Field label="ক্রম" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} />
          <Toggle checked={active} onChange={setActive} label={active ? "সক্রিয়" : "নিষ্ক্রিয় — নাপিতের স্ক্রিনে দেখাবে না"} />
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="w-full">
        সেভ করুন
      </Button>
    </form>
  );
}

function ServiceForm({
  service,
  categoryId,
  categories,
  onDone,
}: {
  service: Service | null;
  categoryId: number;
  categories: Category[];
  onDone: () => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [price, setPrice] = useState(service ? String(service.price) : "");
  const [cat, setCat] = useState(String(categoryId));
  const [order, setOrder] = useState(String(service?.sortOrder ?? ""));
  const [active, setActive] = useState(service?.active ?? true);
  const [error, setError] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const p = parseIntInput(price);
        if (p === null || p <= 0) return setError("দাম ০ এর বেশি পূর্ণ সংখ্যা হবে");
        try {
          if (service) {
            updateService(service.id, {
              name,
              price: p,
              categoryId: Number(cat),
              sortOrder: parseIntInput(order) ?? service.sortOrder,
              active,
            });
          } else addService(Number(cat), name, p);
          onDone();
        } catch (err) {
          setError(errMsg(err));
        }
      }}
    >
      <Field label="সার্ভিসের নাম" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <Field
        label="দাম (৳)"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        hint={service ? "নতুন দাম শুধু এখন থেকে প্রযোজ্য; আগের বিক্রি বদলাবে না।" : undefined}
        required
      />
      <Select label="ক্যাটাগরি" value={cat} onChange={(e) => setCat(e.target.value)}>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      {service && (
        <>
          <Field label="ক্রম" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} />
          <Toggle checked={active} onChange={setActive} label={active ? "সক্রিয়" : "নিষ্ক্রিয় — নাপিতের স্ক্রিনে দেখাবে না"} />
        </>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="w-full">
        সেভ করুন
      </Button>
    </form>
  );
}
