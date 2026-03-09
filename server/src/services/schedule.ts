import { db } from "../db";
import { members, scheduleOverrides, Member } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Check if a given date is a weekday (Monday-Friday).
 */
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Build a member lookup map by ID.
 */
function buildMemberMap(memberList: Member[]): Map<number, Member> {
  const map = new Map<number, Member>();
  for (const m of memberList) {
    map.set(m.id, m);
  }
  return map;
}

/**
 * Get all assignments for a given month.
 * Only returns manually assigned dates (from schedule_overrides).
 */
export async function getMonthSchedule(
  year: number,
  month: number
): Promise<Map<string, Member>> {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const schedule = new Map<string, Member>();

  try {
    const overrides = await db
      .select()
      .from(scheduleOverrides)
      .where(
        and(
          gte(scheduleOverrides.date, startDate),
          lte(scheduleOverrides.date, endDate)
        )
      );

    if (overrides.length === 0) return schedule;

    const allMembers = await db.select().from(members);
    const memberMap = buildMemberMap(allMembers);

    for (const override of overrides) {
      if (override.memberId !== null) {
        const member = memberMap.get(override.memberId);
        if (member) {
          schedule.set(override.date, member);
        }
      }
    }
  } catch {
    // DB not available
  }

  return schedule;
}

/**
 * Get today's assignment.
 */
export async function getTodayAssignment(): Promise<{
  date: string;
  member: Member | null;
}> {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (!isWeekday(today)) {
    return { date: dateStr, member: null };
  }

  try {
    const results = await db
      .select()
      .from(scheduleOverrides)
      .where(eq(scheduleOverrides.date, dateStr))
      .limit(1);

    if (results.length > 0 && results[0].memberId) {
      const memberResults = await db
        .select()
        .from(members)
        .where(eq(members.id, results[0].memberId))
        .limit(1);

      return {
        date: dateStr,
        member: memberResults[0] || null,
      };
    }
  } catch {
    // DB not available
  }

  return { date: dateStr, member: null };
}
