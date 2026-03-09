import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getTodaySchedule } from "@/lib/api";
import type { ScheduleEntry } from "@/types";
import { format, isWeekend } from "date-fns";
import { es } from "date-fns/locale";

export function TodayBanner() {
  const [entry, setEntry] = useState<ScheduleEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodaySchedule()
      .then(setEntry)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error desconocido");
      })
      .finally(() => { setLoading(false); });
  }, []);

  const today = new Date();
  const isWeekendDay = isWeekend(today);
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  let content: React.ReactNode;

  if (loading) {
    content = (
      <p className="text-lg text-amber-800 animate-pulse">Cargando...</p>
    );
  } else if (error) {
    content = <p className="text-lg text-red-700">Error: {error}</p>;
  } else if (isWeekendDay) {
    content = (
      <p className="text-xl font-bold text-amber-900">
        {"\u00A1Hoy es fin de semana! No hay tortillas."}
      </p>
    );
  } else if (!entry?.member) {
    content = (
      <p className="text-xl font-bold text-amber-900">
        No hay nadie asignado para hoy.
      </p>
    );
  } else {
    content = (
      <div className="flex items-center gap-3">
        <span className="text-4xl" role="img" aria-label="tortilla">
          {"\uD83E\uDED3"}
        </span>
        <div>
          <p className="text-2xl font-bold text-amber-900">
            Hoy trae tortillas: {entry.member.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 ring-0 bg-gradient-to-r from-amber-100 via-orange-100 to-yellow-100">
      <CardContent className="py-2">
        <p className="text-sm text-amber-700 capitalize mb-1">
          {formattedDate}
        </p>
        {content}
      </CardContent>
    </Card>
  );
}
