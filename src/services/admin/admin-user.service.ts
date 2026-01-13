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
      const formData = await c.req.formData();
      const file = formData.get("profile") as File;
      const buffer = await file.arrayBuffer();
      const password = formData.get("password");
      const hashPass = await bcrpyt.hash(password as string, salt);
      const body = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: hashPass,
        profile: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
        role: formData.get("role") as string,
      };
      const validated = adminUser.parse(body);
      const user = new adminUserModel(validated);
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
      const condition = { role: { $ne: "admin" } }; // condition not select admin
      const users = await adminUserModel
        .find(condition)
        .select("-profile.data");
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
      const user = await adminUserModel.findById(id).select("-password");
      return c.json(user);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUserProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const profile = await adminUserModel.findById(id).select("profile");
      if (profile) {
        return c.body(profile!.profile.data, 200, {
          "Content-Type": profile!.profile.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const salt = await bcrpyt.genSalt();
      const formData = await c.req.formData();
      const password = formData.get("password");
      const hashPass = await bcrpyt.hash(password as string, salt);
      const body: any = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: hashPass,
        role: formData.get("role") as string,
      };
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }
      const validated = adminUser.parse(body);
      await adminUserModel.findByIdAndUpdate(id, validated);
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
