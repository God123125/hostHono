import type { Context } from "hono";
import mobileUserModel from "../../models/mobile/mobile-user.js";
import { mobileUser } from "../../models/mobile/mobile-user.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
export const mobileUserController = {
  register: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const req = await c.req.json();
      const { name, password, email } = mobileUser.parse(req);
      const hashPass = await bcrpyt.hash(password, salt);
      const body = {
        name: name,
        email: email,
        password: hashPass,
      };
      const user = new mobileUserModel(body);
      await user.save();
      return c.json({
        msg: "User created successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await mobileUserModel.findOne({ email });
      const userBody = {
        name: user?.name,
        email: user?.email,
      };
      if (!user) c.json({ message: "Unauthenticated" }, 401);
      const compare = await bcrpyt.compare(password, user!.password);
      if (!compare) c.json({ message: "Wrong Password" }, 401);
      const token = getToken();
      const expireAt = getExpirationDate(token);
      return c.json({
        user: userBody,
        token: token,
        expireAt: expireAt,
        message: "Login Success",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUsers: async (c: Context) => {
    try {
      const users = await mobileUserModel.find();
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
      const user = await mobileUserModel.findById(id).select("-password");
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
      const { name, password, email } = mobileUser.parse(req);
      const hashPass = await bcrpyt.hash(password, salt);
      const body = {
        name: name,
        email: email,
        password: hashPass,
      };
      await mobileUserModel.findByIdAndUpdate(id, body);
      c.json({
        msg: "User updated successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await mobileUserModel.findByIdAndDelete(id);
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
