"use client";

import { useEffect, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { WishCard, type Wish } from "@/components/admin/WishCard";

const TABS = [
  { value: "active", label: "Активные" },
  { value: "done", label: "Выполненные" },
  { value: "all", label: "Все" },
];

export default function WishesPage() {
  const [tab, setTab] = useState("active");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state when the tab changes, before kicking off the fetch
    setLoading(true);
    const query = tab === "all" ? "" : `?status=${tab}`;
    fetch(`/api/wishes${query}`)
      .then((res) => res.json())
      .then((data) => setWishes(data.wishes ?? []))
      .finally(() => setLoading(false));
  }, [tab]);

  function handleStatusChange(id: string, status: string) {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status } : w))
    );
  }

  function handleNoteSaved(id: string, note: string) {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, admin_note: note } : w))
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value}>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : wishes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пусто</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {wishes.map((wish) => (
                <WishCard
                  key={wish.id}
                  wish={wish}
                  onStatusChange={handleStatusChange}
                  onNoteSaved={handleNoteSaved}
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
