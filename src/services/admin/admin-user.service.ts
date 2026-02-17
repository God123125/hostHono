import type { Context } from "hono";
import adminUserModel from "../../models/admin/admin-user.js";
import { adminUser } from "../../models/admin/admin-user.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import storeModel from "../../models/admin/stores.js";
import { readFile } from "fs/promises";
import path from "path";
export const adminUserController = {
  create: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const formData = await c.req.formData();
      const file = formData.get("profile") as File;
      const password = formData.get("password");
      const hashPass = await bcrpyt.hash(password as string, salt);
      const body: any = {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: hashPass,
        role: formData.get("role") as string,
        phone: formData.get("phone") as string,
      };

      // Handle profile: use uploaded file or default image
      if (file && file.size > 0) {
        // User uploaded a profile image
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      } else {
        // No file uploaded, use default image from src/images folder
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
      const user = new adminUserModel(body);
      await user.save();
      return c.json({
        msg: "User created successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await adminUserModel.findOne({ email });
      const store = await storeModel.findOne({ user: user?._id?.toString() });
      const userBody = {
        username: user?.username,
        email: user?.email,
        role: user?.role,
        store: store,
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
        .select(["-profile.data", "-password"])
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUsers = users.map((el) => {
        return {
          ...el,
          profile_url: `${baseUrl}/api/admin-users/profile/${el._id}`,
        };
      });
      return c.json({
        list: formattedUsers,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const user: any = await adminUserModel
        .findById(id)
        .select(["-password", "-profile.data"])
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUser = {
        ...user,
        profile_url: `${baseUrl}/api/admin-users/profile/${user._id}`,
      };
      return c.json(formattedUser);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUserProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const profile = await adminUserModel.findById(id).select("profile");
      if (profile && profile.profile && profile.profile.data) {
        return c.body(profile.profile.data, 200, {
          "Content-Type": profile.profile.mimetype,
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
  updateAccountInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { username, email, password, role } = await c.req.json();
      const body: any = {};
      if (username) body.username = username;
      if (email) body.email = email;
      if (password) {
        const salt = await bcrpyt.genSalt(10);
        body.password = await bcrpyt.hash(password, salt);
      }
      if (role) body.role = role;
      await adminUserModel.findByIdAndUpdate(id, body, { new: true }); // need to add only admin can update role for user
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
  updateProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("profile") as File;
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
      const profileSchema = adminUser.pick({ profile: true });
      const validated = profileSchema.parse(body);

      await adminUserModel.findByIdAndUpdate(id, validated);
      return c.json({
        msg: "User updated successfully!",
      });
    } catch (e) {
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
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await adminUserModel.find({
        username: { $regex: search, $options: "i" },
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
