import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  waiting: "Ожидание",
  in_progress: "В процессе",
  pending_confirmation: "На подтверждении",
  fulfilled: "Выполнено",
  cancelled: "Отменено",
};

const STATUS_CLASSES: Record<string, string> = {
  waiting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  pending_confirmation:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  fulfilled: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300",
};

export function WishStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn("border-transparent", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
