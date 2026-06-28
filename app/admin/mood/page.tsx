import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoodChart } from "@/components/admin/MoodChart";
import { MoodEntriesTable } from "@/components/admin/MoodEntriesTable";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function getMoodData() {
  const { data: regularUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("role", "user")
    .single();

  if (!regularUser) return { entries: [] };

  const { data: entries } = await supabaseAdmin
    .from("mood_entries")
    .select("*")
    .eq("user_id", regularUser.id)
    .order("date", { ascending: false });

  return { entries: entries ?? [] };
}

export default async function MoodPage() {
  const { entries } = await getMoodData();
  const year = new Date().getFullYear();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Активность за {year} год</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <MoodChart year={year} entries={entries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Все записи</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodEntriesTable entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
