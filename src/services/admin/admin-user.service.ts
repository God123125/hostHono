import type { Context } from "hono";
import adminUserModel from "../../models/admin/admin-user.js";
import { adminUser } from "../../models/admin/admin-user.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
export const adminUserController = {
  create: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const req = await c.req.json();
      const { username, email, password, role } = adminUser.parse(req);
      const hashPass = await bcrpyt.hash(password, salt);
      const body = {
        username: username,
        email: email,
        password: hashPass,
        role: role,
      };
      const user = new adminUserModel(body);
      await user.save();
      return c.json({
        msg: "User created successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await adminUserModel.findOne({ email });
      const userBody = {
        username: user?.username,
        email: user?.email,
      };
      if (!user) return c.json({ message: "Unauthenticated" }, 401);
      const compare = await bcrpyt.compare(password, user.password);
      if (!compare) return c.json({ message: "Wrong password!" }, 401);
      const token = getToken();
      const expireDate = getExpirationDate(token);
      return c.json({
        user: userBody,
        token: token,
        expireAt: expireDate,
        message: "Login Success",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUsers: async (c: Context) => {
    try {
      const users = await adminUserModel.find();
      return c.json({
        list: users,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const user = await adminUserModel.findById().select("-password");
      return c.json(user);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const salt = await bcrpyt.genSalt();
      const req = await c.req.json();
      const { username, email, password, role } = adminUser.parse(req);
      const hashPass = await bcrpyt.hash(password, salt);
      const body = {
        username: username,
        email: email,
        password: hashPass,
        role: role,
      };
      await adminUserModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "User udpated successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await adminUserModel.findByIdAndDelete(id);
      return c.json({
        msg: "User deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
function getToken() {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  return jwt.sign({}, secret, {
    expiresIn: "24h",
  });
}
function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return null;

  // Convert Unix timestamp to JavaScript Date
  return new Date(decoded.exp * 1000);
}
