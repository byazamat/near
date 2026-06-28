import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase";
import { tashkentDayRange, tashkentYearMonth } from "@/lib/time";

export const dynamic = "force-dynamic";

async function getStats() {
  const { year, month } = tashkentYearMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonth =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, "0")}-01`;
  const { start: todayStart, end: todayEnd } = tashkentDayRange();

  const [moodThisMonth, pendingWishes, pendingConfirmation, locationToday] =
    await Promise.all([
      supabaseAdmin
        .from("mood_entries")
        .select("*", { count: "exact", head: true })
        .gte("date", monthStart)
        .lt("date", nextMonth),
      supabaseAdmin
        .from("wishes")
        .select("*", { count: "exact", head: true })
        .eq("status", "waiting"),
      supabaseAdmin
        .from("wishes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_confirmation"),
      supabaseAdmin
        .from("location_calls")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString()),
    ]);

  return {
    moodThisMonth: moodThisMonth.count ?? 0,
    pendingWishes: pendingWishes.count ?? 0,
    pendingConfirmation: pendingConfirmation.count ?? 0,
    locationToday: locationToday.count ?? 0,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Записей настроения за месяц", value: stats.moodThisMonth },
    { label: "Желаний в ожидании", value: stats.pendingWishes },
    { label: "Ждут подтверждения", value: stats.pendingConfirmation },
    { label: "Вызовов сегодня", value: stats.locationToday },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
