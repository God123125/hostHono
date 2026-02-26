import type { Context } from "hono";
import adminUserModel from "../../models/admin/admin-user.js";
import { adminUser } from "../../models/admin/admin-user.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { storeModel } from "../../models/admin/stores.js";
import { readFile } from "fs/promises";
import path from "path";
import { orderModel } from "../../models/mobile/order.js";

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
      const { username, email, password, role, phone } = await c.req.json();

      const hashedPassword = password
        ? await bcrpyt.hash(password, await bcrpyt.genSalt(10))
        : undefined;

      const body = Object.fromEntries(
        Object.entries({
          username,
          email,
          password: hashedPassword,
          role,
          phone,
        }).filter(([_, v]) => v !== undefined),
      );

      await adminUserModel.findByIdAndUpdate(id, body, { new: true });

      return c.json({ msg: "User updated successfully!" });
    } catch (e) {
      return c.json({ error: e }, e instanceof z.ZodError ? 400 : 500);
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
  getOverallDataOfMerchant: async (c: Context) => {
    try {
      // 1. Total user but only role as shop-owner
      const totalShopOwners = await adminUserModel.countDocuments({
        role: "shop-owner",
      });

      // 2. 10 recent create user (excluding admin role as per getUsers pattern)
      const recentUsers = await adminUserModel
        .find({ role: { $ne: "admin" } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("-password -profile.data")
        .lean();

      // 3. Top 10 highest income look up with order data
      const topIncome = await orderModel.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.store",
            totalIncome: { $sum: "$products.subtotal" },
          },
        },
        { $sort: { totalIncome: -1 } },
        { $limit: 10 },
        {
          $addFields: {
            storeObjectId: {
              $convert: {
                input: "$_id",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $match: { storeObjectId: { $ne: null } } },
        {
          $lookup: {
            from: "stores",
            localField: "storeObjectId",
            foreignField: "_id",
            as: "storeInfo",
          },
        },
        { $unwind: "$storeInfo" },
        {
          $addFields: {
            userObjectId: {
              $convert: {
                input: "$storeInfo.user",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        { $match: { userObjectId: { $ne: null } } },
        {
          $lookup: {
            from: "admin_users",
            localField: "userObjectId",
            foreignField: "_id",
            as: "ownerInfo",
          },
        },
        { $unwind: "$ownerInfo" },
        {
          $project: {
            _id: 0,
            storeId: "$_id",
            totalIncome: 1,
            storeName: "$storeInfo.name",
            ownerName: "$ownerInfo.username",
            ownerEmail: "$ownerInfo.email",
          },
        },
      ]);

      return c.json({
        total_shop_owners: totalShopOwners,
        recent_users: recentUsers,
        top_income: topIncome,
      });
    } catch (e) {
      console.error(e);
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
