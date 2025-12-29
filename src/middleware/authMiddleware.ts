import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export const verifyToken = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return c.json({ message: "unauthenticated" }, 401);
  }

  const secret = process.env.JWT_KEY;
  if (!secret) {
    return c.json({ message: "Server auth misconfigured" }, 500);
  }

  try {
    const decoded = jwt.verify(token, secret);
    // store user in context for this request
    c.set("user", (decoded as any).user);
    await next();
  } catch {
    return c.json({ message: "unauthenticated" }, 401);
  }
};
