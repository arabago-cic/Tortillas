import { Router, Request, Response } from "express";
import { generateToken, verifyToken } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/login
 * Validate admin password and return a JWT token.
 */
router.post("/login", (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "Password is required" });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (password !== adminPassword) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const token = generateToken();
  res.json({ token });
});

/**
 * GET /api/auth/verify
 * Verify the current JWT token.
 */
router.get("/verify", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ valid: false, error: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ valid: false, error: "Invalid or expired token" });
    return;
  }

  res.json({ valid: true, role: decoded.role });
});

export default router;
