import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSchedule } from "@/lib/api";
import type { MonthSchedule } from "@/types";
import {
  format,
  addMonths,
  isWeekend,
  isSameDay,
  startOfDay,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

interface UpcomingEntry {
  date: string;
  memberName: string | null;
}

export function ScheduleList() {
  const [entries, setEntries] = useState<UpcomingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpcoming() {
      try {
        const today = new Date();
        const month1 = today.getMonth() + 1;
        const year1 = today.getFullYear();
        const next = addMonths(today, 1);
        const month2 = next.getMonth() + 1;
        const year2 = next.getFullYear();

        const [schedule1, schedule2] = await Promise.all([
          getSchedule(year1, month1),
          getSchedule(year2, month2),
        ]);

        const combined: MonthSchedule = { ...schedule1, ...schedule2 };
        const todayStart = startOfDay(today);

        const upcoming: UpcomingEntry[] = Object.entries(combined)
          .filter(([dateStr]) => {
            const d = parseISO(dateStr);
            return d >= todayStart && !isWeekend(d);
          })
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, 10)
          .map(([dateStr, info]) => ({
            date: dateStr,
            memberName: info.member?.name ?? null,
          }));

        setEntries(upcoming);
      } catch (err) {
        console.error("Error cargando próximas asignaciones:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadUpcoming();
  }, []);

  const today = startOfDay(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Asignaciones</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground animate-pulse">Cargando...</p>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground">
            No hay asignaciones próximas.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const entryDate = parseISO(entry.date);
              const isToday = isSameDay(entryDate, today);
              return (
                <li
                  key={entry.date}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    isToday
                      ? "bg-amber-100 ring-1 ring-amber-300"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex flex-col">
                    <span
                      className={`text-sm capitalize ${
                        isToday ? "font-bold text-amber-900" : ""
                      }`}
                    >
                      {format(entryDate, "EEEE d 'de' MMM", { locale: es })}
                      {isToday && " (hoy)"}
                    </span>
                    <span
                      className={`text-base ${
                        isToday ? "font-semibold text-amber-800" : ""
                      }`}
                    >
                      {entry.memberName ?? "Sin asignar"}
                    </span>
                  </div>
                  {!entry.memberName && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      Pendiente
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
