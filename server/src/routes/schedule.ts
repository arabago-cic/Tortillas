import { Router, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { scheduleOverrides } from "../db/schema";
import { requireAdmin } from "../middleware/auth";
import { getMonthSchedule, getTodayAssignment } from "../services/schedule";

const router = Router();

/**
 * GET /api/schedule?year=2026&month=3
 * Get the full month schedule (only manually assigned dates).
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string, 10);
    const month = parseInt(req.query.month as string, 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      res.status(400).json({ error: "Valid year and month (1-12) are required" });
      return;
    }

    const schedule = await getMonthSchedule(year, month);

    const result: Record<string, any> = {};
    for (const [date, member] of schedule) {
      result[date] = {
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
        },
      };
    }

    res.json({ year, month, schedule: result });
  } catch (error: any) {
    console.error("Failed to fetch schedule:", error.message);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

/**
 * GET /api/schedule/today
 * Get today's assignment.
 */
router.get("/today", async (_req: Request, res: Response) => {
  try {
    const assignment = await getTodayAssignment();

    res.json({
      date: assignment.date,
      member: assignment.member
        ? { id: assignment.member.id, name: assignment.member.name, email: assignment.member.email }
        : null,
    });
  } catch (error: any) {
    console.error("Failed to fetch today's assignment:", error.message);
    res.status(500).json({ error: "Failed to fetch today's assignment" });
  }
});

/**
 * POST /api/schedule/override
 * Assign a member to a specific date (admin only).
 * Body: { date: "YYYY-MM-DD", memberId: number | null, reason?: string }
 */
router.post("/override", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { date, memberId, reason } = req.body;

    if (!date) {
      res.status(400).json({ error: "Date is required (YYYY-MM-DD format)" });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ error: "Date must be in YYYY-MM-DD format" });
      return;
    }

    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      res.status(400).json({ error: "Cannot assign on a weekend" });
      return;
    }

    const result = await db
      .insert(scheduleOverrides)
      .values({
        date,
        memberId: memberId ?? null,
        reason: reason || null,
      })
      .onConflictDoUpdate({
        target: scheduleOverrides.date,
        set: {
          memberId: memberId ?? null,
          reason: reason || null,
        },
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error("Failed to assign schedule:", error.message);
    res.status(500).json({ error: "Failed to assign schedule" });
  }
});

/**
 * DELETE /api/schedule/override/:date
 * Remove assignment for a specific date (admin only).
 */
router.delete("/override/:date", requireAdmin, async (req: Request, res: Response) => {
  try {
    const date = req.params.date as string;

    await db
      .delete(scheduleOverrides)
      .where(eq(scheduleOverrides.date, date));

    res.json({ message: "Assignment removed" });
  } catch (error: any) {
    console.error("Failed to remove assignment:", error.message);
    res.status(500).json({ error: "Failed to remove assignment" });
  }
});

export default router;
