import type { Context } from "hono";
import superAdminModel from "../../models/users/users.js";
import { users } from "../../models/users/users.js";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { storeModel } from "../../models/users/stores.js";

import { readFile } from "fs/promises";
import path from "path";
import { orderModel } from "../../models/mobile/order.js";
import mongoose from "mongoose";
import { uploadToCloudinary, configureCloudinary } from "../../utils/cloudinary.js";

// Initialize Cloudinary
configureCloudinary();

export const superAdminController = {
  create: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const contentType = (c.req.header("content-type") || "").toLowerCase();
      let bodyData: any;
      if (contentType.includes("application/json")) {
        bodyData = await c.req.json();
      } else {
        bodyData = await c.req.parseBody();
      }

      const email = bodyData["email"] as string;

      // Check if email already exists
      const existingUser = await superAdminModel.findOne({ email });
      if (existingUser) {
        return c.json({ error: "Email already exists!" }, 400);
      }

      const file = bodyData["profile"] as any;
      const password = bodyData["password"] as string;
      if (!password || typeof password !== "string") {
        return c.json({ error: "Password is required" }, 400);
      }
      if (password.length < 8) {
        return c.json({ error: "Password must be at least 8 characters" }, 400);
      }
      const hashPass = await bcrpyt.hash(password, salt);
      const body: any = {
        fullname: (bodyData["fullname"] as string) || "",
        username: bodyData["username"] as string,
        email: bodyData["email"] as string,
        password: hashPass,
        role: bodyData["role"] as string,
        phone: (bodyData["phone"] as string) || "",
        address: (bodyData["address"] as string) || "",
        commission_rate: Number(bodyData["commission_rate"]) || 0,
        isActive: true,
      };

      // If profile is an uploaded file (multipart), save to Cloudinary.
      if (file && typeof file === "object" && typeof file.size === "number" && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer, "profile_images");
        body.profile_url = result.secure_url;
      } else if (file && typeof file === "string") {
        // store external image URL
        body.profile_url = file;
      } else {
        const defaultImagePath = path.join(
          process.cwd(),
          "src",
          "images",
          "default-profile.png",
        );
        try {
          const defaultBuffer = await readFile(defaultImagePath);
          const result = await uploadToCloudinary(defaultBuffer, "profile_images");
          body.profile_url = result.secure_url;
        } catch (error) {
          console.log("Default image not found or upload failed at:", defaultImagePath);
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
      const user = await superAdminModel.findOne({ email });
      if (!user) return c.json({ message: "Unauthenticated" }, 401);
      const store = await storeModel
        .findOne({
          merchant: user._id.toString(),
        })
        .select("-store_img");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;

      const userBody = {
        fullname: (user as any).fullName || user.username || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_url: (user as any).profile_url
          ? (user as any).profile_url
          : user.profile
            ? `${baseUrl}/api/admins/profile/${user._id}`
            : null,
        store: store,
      };
      const compare = await bcrpyt.compare(password, user.password);
      if (!compare) return c.json({ message: "Wrong password!" }, 401);
      const token = getToken(user._id, store?._id);
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
      const condition = { role: "super-admin" }; // only select super-admin
      const users = await superAdminModel
        .find(condition)
        .select(["-profile", "-password"])
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUsers = users.map((el) => {
        return {
          ...el,
          profile_url: el.profile 
              ? `${baseUrl}/api/admins/profile/${el._id}`
              : null,
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return c.json({ message: "Invalid id" }, 400);
      }
      const user: any = await superAdminModel
        .findOne({ _id: id, role: "super-admin" })
        .select(["-password", "-profile.data"])
        .lean();

      if (!user) return c.json({ message: "Not Found" }, 404);

      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUser = {
        ...user,
        profile_url: user.profile_url
          ? user.profile_url
          : user.profile
            ? `${baseUrl}/api/admins/profile/${user._id}`
            : null,
      };
      return c.json(formattedUser);
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  getMerchantDetail: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return c.json({ message: "Invalid id" }, 400);
      }
      const data = await superAdminModel.aggregate([
        {
          $project: {
            "profile.data": 0,
            password: 0,
          },
        },
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
          $addFields: {
            merchantIdStr: { $toString: "$_id" },
            profile_url: {
              $concat: [`${baseUrl}/api/users/profile/`, { $toString: "$_id" }],
            },
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "merchantIdStr",
            foreignField: "merchant",
            as: "stores",
          },
        },
        // {
        //   $unwind: {
        //     path: "$stores",
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
        {
          $project: {
            merchantIdStr: 0,
            "stores.store_img": 0,
            "stores.store_type": 0,
            profile: 0,
          },
        },
      ]);
      const merchant = data[0];
      return c.json(merchant);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getUserProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return c.json({ message: "Invalid id" }, 400);
      }
      const doc: any = await superAdminModel.findById(id).select("profile profile_url").lean();
      if (!doc) return c.json({ msg: "Image not found" }, 404);
      if (doc.profile && doc.profile.data) {
        return c.body(doc.profile.data, 200, {
          "Content-Type": doc.profile.mimetype,
        });
      }
      if (doc.profile_url) {
        return c.redirect(doc.profile_url, 302);
      }
      return c.json({ msg: "Image not found" }, 404);
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  updateAccountInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const {
        fullname,
        username,
        email,
        role,
        phone,
        isActive,
        address,
      } = await c.req.json();


      const body = Object.fromEntries(
        Object.entries({
          fullname,
          username,
          email,
          role,
          phone,
          address,
          isActive,
        }).filter(([_, v]) => v !== undefined),
      );

      await superAdminModel.findByIdAndUpdate(id, body, { new: true });

      return c.json({ msg: "User updated successfully!" });
    } catch (e) {
      return c.json({ error: e }, e instanceof z.ZodError ? 400 : 500);
    }
  },
  updateProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const bodyData = await c.req.parseBody();
      const file = bodyData["profile"] as any;
      const body: any = {};

      if (file && typeof file === "object" && typeof file.size === "number" && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer, "profile_images");
        body.profile_url = result.secure_url;
        // Optionally clear the binary profile field if it exists
        body.$unset = { profile: 1 };
      } else if (file && typeof file === "string") {
        // allow updating profile by external URL
        body.profile_url = file;
      }

      if (!body.profile && !body.profile_url) {
        return c.json({ msg: "Please input file or profile URL" }, 400);
      }

      await superAdminModel.findByIdAndUpdate(id, body);
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
      await superAdminModel.findByIdAndDelete(id);
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
  // getOverallDataOfMerchant: async (c: Context) => {
  //   try {
  //     // 1. Total user but only role as shop-owner
  //     const totalShopOwners = await adminUserModel.countDocuments({
  //       role: "shop-owner",
  //     });

  //     // 2. 10 recent create user (excluding admin role as per getUsers pattern)
  //     const recentUsers = await adminUserModel
  //       .find({ role: { $ne: "admin" } })
  //       .sort({ createdAt: -1 })
  //       .limit(10)
  //       .select("-password -profile.data")
  //       .lean();

  //     // 3. Top 10 highest income look up with order data
  //     const topIncome = await orderModel.aggregate([
  //       { $unwind: "$products" },
  //       {
  //         $group: {
  //           _id: "$products.store",
  //           totalIncome: { $sum: "$products.subtotal" },
  //         },
  //       },
  //       { $sort: { totalIncome: -1 } },
  //       { $limit: 10 },
  //       {
  //         $addFields: {
  //           storeObjectId: {
  //             $convert: {
  //               input: "$_id",
  //               to: "objectId",
  //               onError: null,
  //               onNull: null,
  //             },
  //           },
  //         },
  //       },
  //       { $match: { storeObjectId: { $ne: null } } },
  //       {
  //         $lookup: {
  //           from: "stores",
  //           localField: "storeObjectId",
  //           foreignField: "_id",
  //           as: "storeInfo",
  //         },
  //       },
  //       { $unwind: "$storeInfo" },
  //       {
  //         $addFields: {
  //           userObjectId: {
  //             $convert: {
  //               input: "$storeInfo.user",
  //               to: "objectId",
  //               onError: null,
  //               onNull: null,
  //             },
  //           },
  //         },
  //       },
  //       { $match: { userObjectId: { $ne: null } } },
  //       {
  //         $lookup: {
  //           from: "admin_users",
  //           localField: "userObjectId",
  //           foreignField: "_id",
  //           as: "ownerInfo",
  //         },
  //       },
  //       { $unwind: "$ownerInfo" },
  //       {
  //         $project: {
  //           _id: 0,
  //           storeId: "$_id",
  //           totalIncome: 1,
  //           storeName: "$storeInfo.name",
  //           ownerName: "$ownerInfo.username",
  //           ownerEmail: "$ownerInfo.email",
  //         },
  //       },
  //     ]);

  //     return c.json({
  //       total_shop_owners: totalShopOwners,
  //       recent_users: recentUsers,
  //       top_income: topIncome,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     return c.json({ error: e }, 500);
  //   }
  // },
  getMerchantOverallStats: async (c: Context) => {
    try {
      const totalMerchants = await superAdminModel.countDocuments();
      const totalActiveMerchants = await superAdminModel.countDocuments({
        isActive: true,
      });

      const [commissionStats] = await superAdminModel.aggregate([
        {
          $group: {
            _id: null,
            totalCommission: { $sum: "$amount" },
            pendingCommission: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
              },
            },
            paidCommission: {
              $sum: {
                $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0],
              },
            },
          },
        },
      ]);
      return c.json({
        totalMerchants: totalMerchants ?? 0,
        totalActiveMerchants: totalActiveMerchants ?? 0,
        totalCommission: commissionStats?.totalCommission ?? 0,
        pendingCommission: commissionStats?.pendingCommission ?? 0,
        paidCommission: commissionStats?.paidCommission ?? 0,
      });
    } catch (e) {
      console.error(e);
      return c.json({ error: e }, 500);
    }
  },
  getCommissions: async (c: Context) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const data = await superAdminModel.aggregate([
      {
        $addFields: {
          merchant: { $toObjectId: "$merchant" },
        },
      },
      {
        $match: {
          createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "merchant",
          foreignField: "_id",
          as: "merchantData",
        },
      },
      {
        $unwind: "$merchantData",
      },
      {
        $group: {
          _id: "$merchantData._id",
          merchant_name: { $first: "$merchantData.name" },
          merchant_email: { $first: "$merchantData.email" },
          merchant_phone: { $first: "$merchantData.phone" },

          totalPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0] },
          },
          totalPaid: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
          },

          countPending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          countPaid: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },

          rate: { $first: "$rate" },
        },
      },
      {
        $project: {
          _id: 0,
          merchant: {
            _id: "$_id",
            name: "$merchant_name",
            email: "$merchant_email",
            phone: "$merchant_phone",
          },
          totalPending: 1,
          totalPaid: 1,
          countPending: 1,
          countPaid: 1,
          rate: 1,
        },
      },
    ]);
    return c.json({ list: data });
  },
  updatePassword: async (c: Context) => {
    try {
      const { email, old_pass, new_pass } = await c.req.json();
      if (!email || !old_pass || !new_pass) {
        return c.json({ msg: "email, old_pass and new_pass are required" }, 400);
      }

      if (typeof new_pass !== "string" || new_pass.length < 8) {
        return c.json({ msg: "New password must be at least 8 characters" }, 400);
      }

      const user = await superAdminModel.findOne({ email });
      if (!user) return c.json({ msg: "User not found!" }, 404);

      const compare = await bcrpyt.compare(old_pass, user.password);
      if (!compare) return c.json({ msg: "Old password was not correct" }, 401);

      const salt = await bcrpyt.genSalt(10);
      user.password = await bcrpyt.hash(new_pass, salt);
      await user.save();
      return c.json({ msg: "Password updated successfully!" });
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },

  updateComission: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      await superAdminModel.updateMany(
        {
          merchant: id, // filter by merchant
          status: "pending", // only pending commissions
          createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }, // this month
        },
        { $set: { status: "paid" } }, // mark them paid
      );
      return c.json({
        msg: "Commission marked as paid",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
function getToken(userId: mongoose.Types.ObjectId, storeId: any) {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  return jwt.sign({ user: userId, store: storeId }, secret, {
    expiresIn: "24h",
  });
}
function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return null;

  // Convert Unix timestamp to JavaScript Date
  return new Date(decoded.exp * 1000);
}
