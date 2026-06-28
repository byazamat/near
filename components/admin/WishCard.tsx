"use client";

import { useState } from "react";
import { Play, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WishStatusBadge } from "@/components/admin/WishStatusBadge";

export interface Wish {
  id: string;
  title: string;
  description: string | null;
  category: "sparkle" | "dream" | "desire";
  status: string;
  admin_note: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<Wish["category"], string> = {
  sparkle: "✨ Маленькие радости",
  dream: "🌙 Большие мечты",
  desire: "🔥 Страстные желания",
};

interface WishCardProps {
  wish: Wish;
  onStatusChange: (id: string, status: string) => void;
  onNoteSaved: (id: string, note: string) => void;
}

export function WishCard({ wish, onStatusChange, onNoteSaved }: WishCardProps) {
  const [note, setNote] = useState(wish.admin_note ?? "");
  const [savingNote, setSavingNote] = useState(false);

  async function changeStatus(status: string) {
    onStatusChange(wish.id, status);
    await fetch(`/api/wishes/${wish.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  async function saveNote() {
    setSavingNote(true);
    await fetch(`/api/wishes/${wish.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin_note: note }),
    });
    setSavingNote(false);
    onNoteSaved(wish.id, note);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <CardTitle className="text-base wrap-break-word">{wish.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(wish.created_at).toLocaleDateString("ru-RU")}
          </p>
        </div>
        <div className="flex flex-row flex-wrap items-end gap-1.5 sm:flex-col">
          <WishStatusBadge status={wish.status} />
          <Badge variant="secondary">{CATEGORY_LABELS[wish.category]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {wish.description && (
          <p className="text-sm text-muted-foreground">{wish.description}</p>
        )}

        {wish.status === "waiting" && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => changeStatus("in_progress")}>
              <Play /> Начать
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => changeStatus("cancelled")}
            >
              <X /> Отменить
            </Button>
          </div>
        )}

        {wish.status === "in_progress" && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => changeStatus("pending_confirmation")}>
              <Check /> На подтверждение
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => changeStatus("cancelled")}
            >
              <X /> Отменить
            </Button>
          </div>
        )}

        <Textarea
          placeholder="Заметка администратора (не видна пользователю)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={saveNote}
          rows={2}
        />
        {savingNote && <p className="text-xs text-muted-foreground">Сохранение...</p>}
      </CardContent>
    </Card>
  );
}
