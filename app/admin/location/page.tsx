"use client";

import { useEffect, useState } from "react";
import { LocationCallCard, type LocationCall } from "@/components/admin/LocationCallCard";

export default function LocationPage() {
  const [calls, setCalls] = useState<LocationCall[]>([]);

  async function fetchCalls() {
    const res = await fetch("/api/location");
    if (res.ok) {
      const data = await res.json();
      setCalls(data.calls ?? []);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch + 30s polling on mount
    fetchCalls();
    const interval = setInterval(fetchCalls, 30000);
    return () => clearInterval(interval);
  }, []);

  function handleStatusChange(id: string, status: string) {
    setCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: status as LocationCall["status"] } : c))
    );
  }

  if (calls.length === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет вызовов</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {calls.map((call) => (
        <LocationCallCard
          key={call.id}
          call={call}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
