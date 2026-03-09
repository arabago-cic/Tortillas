import { useCallback, useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { getSchedule, getMembers, createOverride, removeAssignment } from "@/lib/api";
import type { MonthSchedule, Member } from "@/types";
import { format, isWeekend, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DayButton } from "react-day-picker";

export function TortillaCalendar() {
  const { isAdmin } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [schedule, setSchedule] = useState<MonthSchedule>({});
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment dialog state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSchedule = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const data = await getSchedule(
        date.getFullYear(),
        date.getMonth() + 1
      );
      setSchedule(data);
    } catch (err) {
      console.error("Error cargando calendario:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchedule(month);
  }, [month, loadSchedule]);

  useEffect(() => {
    if (isAdmin) {
      void getMembers().then(setMembers).catch(console.error);
    }
  }, [isAdmin]);

  function handleDayClick(day: Date) {
    if (!isAdmin) return;
    if (isWeekend(day)) return;
    setSelectedDate(day);
    const dateKey = format(day, "yyyy-MM-dd");
    const existing = schedule[dateKey];
    setSelectedMemberId(
      existing?.member ? String(existing.member.id) : ""
    );
    setNote("");
  }

  async function handleSave() {
    if (!selectedDate || !selectedMemberId) return;
    setSaving(true);
    try {
      await createOverride(
        format(selectedDate, "yyyy-MM-dd"),
        Number(selectedMemberId),
        note || undefined
      );
      setSelectedDate(null);
      await loadSchedule(month);
    } catch (err) {
      console.error("Error asignando:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!selectedDate) return;
    setSaving(true);
    try {
      await removeAssignment(format(selectedDate, "yyyy-MM-dd"));
      setSelectedDate(null);
      await loadSchedule(month);
    } catch (err) {
      console.error("Error quitando asignación:", err);
    } finally {
      setSaving(false);
    }
  }

  const today = new Date();
  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const hasExisting = dateKey ? !!schedule[dateKey]?.member : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        {loading && Object.keys(schedule).length === 0 ? (
          <p className="text-muted-foreground animate-pulse py-8">
            Cargando calendario...
          </p>
        ) : (
          <Calendar
            locale={es}
            mode="single"
            selected={undefined}
            onSelect={(date) => { if (date) handleDayClick(date); }}
            month={month}
            onMonthChange={setMonth}
            className="w-full [--cell-size:--spacing(12)] sm:[--cell-size:--spacing(14)]"
            classNames={{
              day: "group/day relative h-auto w-full rounded-(--cell-radius) p-0 text-center select-none",
              week: "mt-1 flex w-full",
              weekday: "flex-1 text-[0.75rem] font-normal text-muted-foreground select-none",
            }}
            components={{
              DayButton: (props: React.ComponentProps<typeof DayButton>) => {
                const { day, modifiers, ...rest } = props;
                const dk = format(day.date, "yyyy-MM-dd");
                const entry = schedule[dk];
                const weekend = isWeekend(day.date);
                const isToday = isSameDay(day.date, today);
                const memberName = entry?.member?.name;

                let displayName = "";
                if (memberName) {
                  displayName =
                    memberName.length > 10
                      ? memberName.split(" ")[0] ?? memberName.slice(0, 8)
                      : memberName;
                }

                return (
                  <button
                    type="button"
                    {...rest}
                    className={`
                      relative flex flex-col items-center justify-start
                      w-full min-h-12 sm:min-h-14 rounded-lg p-1
                      text-sm transition-colors
                      ${weekend ? "text-muted-foreground/50 bg-muted/30" : ""}
                      ${isToday && !weekend ? "bg-amber-200/60 ring-1 ring-amber-400" : ""}
                      ${!weekend && !isToday && memberName ? "bg-amber-50" : ""}
                      ${!weekend && !isToday && !memberName ? "bg-muted/10" : ""}
                      ${isAdmin && !weekend ? "cursor-pointer hover:bg-amber-100" : "cursor-default"}
                      ${modifiers.outside ? "text-muted-foreground/30" : ""}
                    `}
                  >
                    <span
                      className={`text-xs sm:text-sm leading-tight ${
                        isToday ? "font-bold" : ""
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                    {displayName && !modifiers.outside ? (
                      <span className="text-[0.6rem] sm:text-[0.7rem] leading-tight truncate max-w-full mt-0.5 text-amber-800 font-medium">
                        {displayName}
                      </span>
                    ) : !weekend && !modifiers.outside ? (
                      <span className="text-[0.55rem] sm:text-[0.65rem] leading-tight text-muted-foreground/40 mt-0.5">
                        Sin asignar
                      </span>
                    ) : null}
                  </button>
                );
              },
            }}
          />
        )}
      </CardContent>

      {/* Assignment Dialog */}
      <Dialog
        open={selectedDate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Turno de Tortillas</DialogTitle>
            <DialogDescription>
              {selectedDate
                ? format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", {
                    locale: es,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="assign-member">¿Quién trae tortillas este día?</Label>
              <select
                id="assign-member"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm"
                value={selectedMemberId}
                onChange={(e) => { setSelectedMemberId(e.target.value); }}
              >
                <option value="">Seleccionar persona...</option>
                {members
                  .filter((m) => m.active)
                  .map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assign-note">Nota (opcional)</Label>
              <Input
                id="assign-note"
                value={note}
                onChange={(e) => { setNote(e.target.value); }}
                placeholder="Ej: intercambio con María, cumpleaños..."
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {hasExisting && (
              <Button
                variant="destructive"
                disabled={saving}
                onClick={() => { void handleRemove(); }}
              >
                Quitar asignación
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => { setSelectedDate(null); }}
            >
              Cancelar
            </Button>
            <Button
              disabled={!selectedMemberId || saving}
              onClick={() => { void handleSave(); }}
            >
              {saving ? "Guardando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
