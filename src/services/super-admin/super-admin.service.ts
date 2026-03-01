import type { Context } from "hono";
import superAdminModel from "../../models/super-admin/super-admin.js";
import { superAdmin } from "../../models/super-admin/super-admin.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { readFile } from "fs/promises";
import path from "path";
export const superAdminController = {
  create: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const bodyData = await c.req.parseBody();
      const email = bodyData["email"] as string;

      // Check if email already exists
      const existingUser = await superAdminModel.findOne({ email });
      if (existingUser) {
        return c.json({ error: "Email already exists!" }, 400);
      }

      const file = bodyData["profile"] as File;
      const password = bodyData["password"] as string;
      const hashPass = await bcrpyt.hash(password, salt);
      const body: any = {
        fullname: bodyData["fullname"] as string,
        email: bodyData["email"] as string,
        password: hashPass,
        role: "super-admin",
        phone: bodyData["phone"] as string,
      };

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      } else {
        const defaultImagePath = path.join(
          process.cwd(),
          "src",
          "images",
          "default-profile.png",
        );
        try {
          const defaultBuffer = await readFile(defaultImagePath);
          body.profile = {
            filename: "default-profile.png",
            mimetype: "image/png",
            data: defaultBuffer,
            length: defaultBuffer.length,
          };
        } catch (error) {
          console.log("Default image not found at:", defaultImagePath);
        }
      }
      const user = new superAdminModel(body);
      await user.save();
      return c.json({
        msg: "Super Admin created successfully!",
      });
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await superAdminModel.findOne({ email, role: "super-admin" });

      if (!user) return c.json({ message: "Unauthenticated" }, 401);

      const userBody = {
        fullname: user?.fullname,
        email: user?.email,
        role: user?.role,
      };

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
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  getUsers: async (c: Context) => {
    try {
      const condition = { role: "super-admin" }; // only select super-admin
      const users = await superAdminModel
        .find(condition)
        .select(["-profile.data", "-password"])
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUsers = users.map((el) => {
        return {
          ...el,
          profile_url: `${baseUrl}/api/super-admins/profile/${el._id}`,
        };
      });
      return c.json({
        list: formattedUsers,
      });
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const user: any = await superAdminModel
        .findOne({ _id: id, role: "super-admin" })
        .select(["-password", "-profile.data"])
        .lean();

      if (!user) return c.json({ message: "Not Found" }, 404);

      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUser = {
        ...user,
        profile_url: `${baseUrl}/api/super-admins/profile/${user._id}`,
      };
      return c.json(formattedUser);
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  getUserProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const profile = await superAdminModel.findById(id).select("profile");
      if (profile && profile.profile && profile.profile.data) {
        return c.body(profile.profile.data, 200, {
          "Content-Type": profile.profile.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  updateAccountInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { fullname, email, password, role } = await c.req.json();
      const body: any = {};
      if (fullname) body.fullname = fullname;
      if (email) body.email = email;
      if (password) {
        const salt = await bcrpyt.genSalt(10);
        body.password = await bcrpyt.hash(password, salt);
      }
      if (role) body.role = role;
      await superAdminModel.findOneAndUpdate({ _id: id, role: "super-admin" }, body, { new: true });
      return c.json({
        msg: "Super Admin updated successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  updateProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const bodyData = await c.req.parseBody();
      const file = bodyData["profile"] as File;
      const body: any = {};

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }
      if (!body.profile) {
        return c.json({ msg: "Please input file" }, 400);
      }

      // Only validate profile part
      const profileSchema = superAdmin.pick({ profile: true });
      const validated = profileSchema.parse(body);

      await superAdminModel.findOneAndUpdate({ _id: id, role: "super-admin" }, validated);
      return c.json({
        msg: "Super Admin updated successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await superAdminModel.findOneAndDelete({ _id: id, role: "super-admin" });
      return c.json({
        msg: "Super Admin deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await superAdminModel.find({
        fullname: { $regex: search, $options: "i" },
        role: "super-admin"
      });
      if (data.length > 0) {
        return c.json({
          list: data,
        });
      } else {
        return c.json({
          msg: "No data found!",
        });
      }
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
