import { Router, Request, Response } from "express";
import { db } from "../db";
import { members } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";

const router = Router();

/**
 * GET /api/members
 * List all members (public). Returns active members by default.
 * Pass ?all=true to include inactive members.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const includeAll = req.query.all === "true";

    let query;
    if (includeAll) {
      query = db.select().from(members).orderBy(asc(members.sortOrder));
    } else {
      query = db
        .select()
        .from(members)
        .where(eq(members.active, true))
        .orderBy(asc(members.sortOrder));
    }

    const result = await query;
    res.json(result);
  } catch (error: any) {
    console.error("Failed to fetch members:", error.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

/**
 * POST /api/members
 * Add a new member (admin only).
 */
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    // Auto-calculate order: max existing order + 1
    const existing = await db.select().from(members).orderBy(asc(members.sortOrder));
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(m => m.sortOrder)) + 1 : 0;

    const result = await db
      .insert(members)
      .values({
        name,
        email: email || null,
        sortOrder: nextOrder,
        active: true,
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error: any) {
    console.error("Failed to add member:", error.message);
    res.status(500).json({ error: "Failed to add member" });
  }
});

/**
 * PUT /api/members/reorder
 * Reorder members (admin only).
 * Expects body: { orders: [{ id: number, order: number }, ...] }
 */
router.put("/reorder", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      res.status(400).json({ error: "orders must be an array of { id, order }" });
      return;
    }

    for (const item of orders) {
      if (!item.id || item.order === undefined) {
        res.status(400).json({ error: "Each item must have id and order" });
        return;
      }
    }

    for (const item of orders) {
      await db
        .update(members)
        .set({ sortOrder: item.order })
        .where(eq(members.id, item.id));
    }

    const updated = await db
      .select()
      .from(members)
      .orderBy(asc(members.sortOrder));

    res.json(updated);
  } catch (error: any) {
    console.error("Failed to reorder members:", error.message);
    res.status(500).json({ error: "Failed to reorder members" });
  }
});

/**
 * PUT /api/members/:id
 * Update a member (admin only).
 */
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid member ID" });
      return;
    }

    const { name, email, active, order: sortOrder } = req.body;

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (active !== undefined) updateData.active = active;
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    const result = await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error("Failed to update member:", error.message);
    res.status(500).json({ error: "Failed to update member" });
  }
});

/**
 * DELETE /api/members/:id
 * Soft delete (deactivate) a member (admin only).
 */
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid member ID" });
      return;
    }

    const result = await db
      .update(members)
      .set({ active: false })
      .where(eq(members.id, id))
      .returning();

    if (result.length === 0) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    res.json({ message: "Member deactivated", member: result[0] });
  } catch (error: any) {
    console.error("Failed to deactivate member:", error.message);
    res.status(500).json({ error: "Failed to deactivate member" });
  }
});

export default router;
