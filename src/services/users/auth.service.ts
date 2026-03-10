import type { Context } from "hono";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { merchantModel } from "../../models/users/merchants.js";
import { storeModel } from "../../models/users/stores.js";
import superAdminModel from "../../models/users/users.js";

function getToken(payload: object) {
  const secret = process.env.JWT_KEY;
  if (!secret) throw new Error("JWT_KEY is not defined");
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) return null;
  return new Date(decoded.exp * 1000);
}

export const authController = {
  login: async (c: Context) => {
    try {
      const { email, password, role } = (await c.req.json()) as any;

      if (!email || !password) {
        return c.json({ message: "Email and password are required" }, 400);
      }

      // If role provided, restrict search to that role
      let user: any = null;
      let userRole: string | null = null;

      if (!role || role === "super-admin") {
        user = await superAdminModel.findOne({ email });
        if (user) userRole = "super-admin";
      }

      if (!user && (!role || role === "merchant")) {
        user = await merchantModel.findOne({ email });
        if (user) userRole = "merchant";
      }

      if (!user) return c.json({ message: "Unauthenticated" }, 401);

      const match = await bcrpyt.compare(password, user.password);
      if (!match) return c.json({ message: "Wrong password" }, 401);

      // optional: include store id for merchants
      let store = null;
      if (userRole === "merchant") {
        const s = await storeModel.findOne({ merchant: user._id.toString() }).select("_id");
        store = s?._id ?? null;
      }

      const tokenPayload: any = { user: user._id.toString(), role: userRole };
      if (store) tokenPayload.store = store.toString();

      const token = getToken(tokenPayload);
      const expireAt = getExpirationDate(token);

      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;

      let userBody: any = {
        id: user._id,
        email: user.email,
        role: userRole,
      };

      if (userRole === "super-admin") {
        userBody = {
          id: user._id,
          fullname: (user as any).fullName || (user as any).username || "",
          email: user.email,
          phone: user.phone,
          role: userRole,
          profile_url: (user as any).profile
            ? `${baseUrl}/api/admins/profile/${user._id}`
            : null,
        };
      } else if (userRole === "merchant") {
        userBody = {
          id: user._id,
          fullname: (user as any).name || (user as any).username || "",
          email: user.email,
          phone: user.phone,
          role: userRole,
          profile_url: (user as any).profile
            ? `${baseUrl}/api/merchants/profile/${user._id}`
            : null,
        };
      }

      return c.json({ user: userBody, token, expireAt });
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
 
};
