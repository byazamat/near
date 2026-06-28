"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MoodEntry {
  date: string;
  score: number;
  comment: string | null;
}

interface MoodChartProps {
  year: number;
  entries: MoodEntry[];
}

const CELL_SIZE = 12;
const CELL_GAP = 3;

function colorForScore(score: number | undefined) {
  if (score === undefined) return "#ebedf0";
  if (score <= 3) return "#fce7f3";
  if (score <= 6) return "#f9a8d4";
  if (score <= 8) return "#ec4899";
  return "#be185d";
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function MoodChart({ year, entries }: MoodChartProps) {
  const entryByDate = new Map(entries.map((e) => [e.date, e]));

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));

  const gridStart = new Date(jan1);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

  const gridEnd = new Date(dec31);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  const width = weeks.length * (CELL_SIZE + CELL_GAP);
  const height = 7 * (CELL_SIZE + CELL_GAP);

  return (
    <svg width={width} height={height} role="img" aria-label={`Активность настроения за ${year} год`}>
      {weeks.map((week, weekIndex) =>
        week.map((date, dayIndex) => {
          const inYear = date.getUTCFullYear() === year;
          const key = toDateKey(date);
          const entry = inYear ? entryByDate.get(key) : undefined;
          const fill = inYear ? colorForScore(entry?.score) : "transparent";

          const rect = (
            <rect
              x={weekIndex * (CELL_SIZE + CELL_GAP)}
              y={dayIndex * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={fill}
            />
          );

          if (!inYear) {
            return <g key={key}>{rect}</g>;
          }

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>{rect}</TooltipTrigger>
              <TooltipContent>
                <span>
                  {key} · {entry ? `${entry.score}/10` : "нет записи"}
                  {entry?.comment ? ` · ${entry.comment}` : ""}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })
      )}
    </svg>
  );
}
