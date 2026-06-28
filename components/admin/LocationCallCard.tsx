"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface LocationCall {
  id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  status: "pending" | "seen" | "on_the_way";
  created_at: string;
}

const STATUS_LABELS: Record<LocationCall["status"], string> = {
  pending: "Ожидание",
  seen: "Увидено",
  on_the_way: "Уже едет",
};

interface LocationCallCardProps {
  call: LocationCall;
  onStatusChange: (id: string, status: string) => void;
}

export function LocationCallCard({ call, onStatusChange }: LocationCallCardProps) {
  async function handleOnTheWay() {
    onStatusChange(call.id, "on_the_way");
    await fetch(`/api/location/${call.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "on_the_way" }),
    });
  }

  const mapsUrl = `https://maps.yandex.ru/?pt=${call.longitude},${call.latitude}&z=16&l=map`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {new Date(call.created_at).toLocaleString("ru-RU")}
        </CardTitle>
        <Badge variant="secondary">{STATUS_LABELS[call.status]}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {call.address ?? "Адрес не указан"}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary underline"
        >
          Открыть на Яндекс.Картах
        </a>
        {call.status !== "on_the_way" && (
          <Button size="sm" onClick={handleOnTheWay} className="w-fit">
            🚗 Выезжаю
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
