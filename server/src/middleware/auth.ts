import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "default-jwt-secret-change-me";
};

/**
 * Generate a JWT token for the admin user.
 */
export function generateToken(): string {
  return jwt.sign({ role: "admin" }, getJwtSecret(), { expiresIn: "24h" });
}

/**
 * Verify a JWT token and return the decoded payload, or null if invalid.
 */
export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === "string") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express middleware that requires a valid admin JWT token.
 * Expects the token in the Authorization header as "Bearer <token>".
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded || decoded.role !== "admin") {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  next();
}
