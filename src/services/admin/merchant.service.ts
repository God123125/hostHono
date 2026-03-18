import type { Context } from "hono";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { adminModel } from "../../models/admin/merchants.js";
import { readFile } from "fs/promises";
import path from "path";
import { orderModel } from "../../models/mobile/order.js";
import { storeModel } from "../../models/admin/stores.js";
import mongoose, { Types } from "mongoose";
import { commissionModel } from "../../models/admin/commission.js";
import { UserRole } from "../../enum/user-role.enum.js";
export const adminController = {
  createMerchant: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      const bodyData = await c.req.parseBody();
      const email = bodyData["email"] as string;
      // Check if email already exists
      const existingUser = await adminModel.findOne({ email });
      if (existingUser) {
        return c.json({ error: "Email already exists!" }, 400);
      }

      const file = bodyData["profile"] as File;
      const password = bodyData["password"] as string;
      const hashPass = await bcrpyt.hash(password, salt);
      const body: any = {
        fullname: (bodyData["fullname"] as string) || "",
        username: bodyData["username"] as string,
        email: bodyData["email"] as string,
        password: hashPass,
        role: (bodyData["role"] as string) || "MERCHANT",
        phone: (bodyData["phone"] as string) || "",
        address: (bodyData["address"] as string) || "",
        commission_rate: Number(bodyData["commission_rate"]) || 0,
        isActive: true,
      };

      // Handle profile as File from form data (like super admin)
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.profile = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }
      // If no profile provided, use default image
      if (!body.profile) {
        const imageUrl = `${process.env.APP_URL}/images/default-profile.png`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.log("Failed to fetch default image:", response.status);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        body.profile = {
          filename: "default-product.png",
          mimetype: "image/png",
          data: buffer,
          length: buffer.length,
        };
      }

      await adminModel.create(body);
      return c.json({ msg: "Admin created successfully!" });
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  // for getting user option
  getMany: async (c: Context) => {
    try {
      const merchants = await adminModel.aggregate([
        {
          $match: {
            role: { $ne: "SUPER_ADMIN" }, // ✅ filter out SUPER_ADMIN
          },
        },
        {
          $project: {
            profile: 0,
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "merchant",
            as: "stores",
          },
        },
        {
          $match: {
            stores: { $size: 0 },
          },
        },
        {
          $project: {
            stores: 0,
          },
        },
      ]);
      return c.json({
        list: merchants,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  // get many users
  getManyUserForDisplay: async (c: Context) => {
    try {
      const merchants = await adminModel
        .find({
          role: { $ne: UserRole.SuperAdmin },
        })
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedMerchants = merchants.map((el) => {
        return {
          ...el,
          profile_url: `${baseUrl}/api/admins/profile/${el?._id}`,
        };
      });
      return c.json({
        list: formattedMerchants,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return c.json({ message: "Invalid id" }, 400);
      }
      const user: any = await adminModel
        .findById(id)
        .select(["-password", "-profile.data"])
        .lean();

      if (!user) return c.json({ message: "Not Found" }, 404);

      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedUser = {
        ...user,
        profile_url: `${baseUrl}/api/admins/profile/${user?._id}`,
      };
      return c.json(formattedUser);
    } catch (e: any) {
      return c.json({ error: e.message || e }, 500);
    }
  },
  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await adminModel.findOne({ email });
      if (!user) return c.json({ message: "Unauthenticated" }, 401);
      const store = await storeModel.findOne({
        merchant: user._id.toString(),
      });
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const userBody: any = {
        fullname: (user as any).name || user.username || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_url: user.profile
          ? `${baseUrl}/api/admins/profile/${user?._id}`
          : null,
      };
      if (store) {
        userBody.store = store?._id;
      }
      const compare = await bcrpyt.compare(password, user.password);
      if (!compare) return c.json({ message: "Wrong password!" }, 401);
      const token = getToken(user._id, userBody.store);
      const expireDate = getExpirationDate(token);
      return c.json({
        user: userBody,
        token: token,
        expireAt: expireDate,
        message: "Login Success",
      });
    } catch (e) {
      console.log(e);
      return c.json({ error: e }, 500);
    }
  },
  getProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await adminModel.findById(id).select("profile");
      if (img) {
        return c.body(img!.profile!.data, 200, {
          "Content-Type": img!.profile!.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getAdminDetail: async (c: Context) => {
    try {
      // const id = c.req.param("id");
      const id = c.get("user");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const data = await adminModel.aggregate([
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
            // merchantIdStr: { $toString: "$_id" },
            profile_url: {
              $concat: [
                `${baseUrl}/api/admins/profile/`,
                { $toString: "$_id" },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "_id",
            foreignField: "merchant",
            as: "stores",
          },
        },
        {
          $unwind: {
            path: "$stores",
            preserveNullAndEmptyArrays: true,
          },
        },
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
  updateAccountInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { fullname, username, email, role, phone, isActive, address } =
        await c.req.json();

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

      await adminModel.findByIdAndUpdate(id, body, { new: true });

      return c.json({ msg: "Merchant updated successfully!" });
    } catch (e) {
      console.log(e);
      return c.json({ error: e }, e instanceof z.ZodError ? 400 : 500);
    }
  },
  updatePassword: async (c: Context) => {
    try {
      const { email, oldPass, newPass } = await c.req.json();
      const hasEmail = await adminModel.findOne({ email: email });
      if (!hasEmail) return c.json({ msg: "Email not found!" }, 400);
      const compare = await bcrpyt.compare(oldPass, hasEmail.password);
      if (!compare) return c.json({ msg: "Old password is incorrect!" });
      const hashedPassword = newPass
        ? await bcrpyt.hash(newPass, await bcrpyt.genSalt(10))
        : undefined;
      const body = {
        password: hashedPassword,
      };
      await adminModel.findByIdAndUpdate(hasEmail._id, body, { new: true });
      return c.json({ msg: "User password updated successfully!" });
    } catch (e) {
      console.log(e);
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
        return c.json({ msg: "No image provided" }, 400);
      }
      await adminModel.findByIdAndUpdate(id, body, { new: true });
      return c.json({ msg: "Profile updated successfully!" });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await adminModel.findByIdAndDelete(id);
      return c.json({
        msg: "Merchant deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await adminModel.find({
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
  getMerchantOverallStats: async (c: Context) => {
    try {
      const totalMerchants = await adminModel.countDocuments();
      const totalActiveMerchants = await adminModel.countDocuments({
        isActive: true,
      });

      const [commissionStats] = await commissionModel.aggregate([
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
  getOrderInfo: async (c: Context) => {
    try {
      const store = new Types.ObjectId(c.get("store"));
      const searchQuery = c.req.query("q")
        ? decodeURIComponent(c.req.query("q") as string)
        : null;

      // Build optional search match
      const searchMatch = searchQuery
        ? {
            $match: {
              $or: [
                { "userInfo.name": { $regex: searchQuery, $options: "i" } },
                { "userInfo.email": { $regex: searchQuery, $options: "i" } },
                { "products.name": { $regex: searchQuery, $options: "i" } },
                { status: { $regex: searchQuery, $options: "i" } },
              ],
            },
          }
        : null;

      const data = await orderModel.aggregate([
        {
          $unwind: { path: "$products", preserveNullAndEmptyArrays: false },
        },
        {
          $match: { "products.store": store },
        },
        {
          $addFields: { user: { $toObjectId: "$user" } },
        },
        {
          $lookup: {
            from: "mobile_users",
            let: { userId: "$user" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$userId"] },
                },
              },
              {
                $project: {
                  email: 1,
                  name: 1,
                },
              },
            ],
            as: "userInfo",
          },
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        ...(searchMatch ? [searchMatch] : []),
        {
          $group: {
            _id: "$_id",
            // products: {
            //   $push: {
            //     name: "$products.name",
            //     price: "$products.price",
            //     qty: "$products.qty",
            //     image_url: "$products.imageUrl",
            //   },
            // },
            delivery_fee: { $first: "$delivery_fee" },
            total: { $first: "$total" },
            payment_method: { $first: "$payment_method" },
            status: { $first: "$status" },
            user: { $first: "$userInfo" },
            number_of_products: { $sum: "$products.qty" },
            order_date: { $first: "$createdAt" },
          },
        },
      ]);
      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getDetailOrderInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const data = await orderModel.findById(id);
      return c.json(data);
    } catch (e) {
      console.log(e);
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
    const data = await commissionModel.aggregate([
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
          from: "admins",
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
          merchant_name: { $first: "$merchantData.fullname" },
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
      await commissionModel.updateMany(
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
  getOverallStats: async (c: Context) => {
    try {
      const totalMerchants = await adminModel.countDocuments({
        role: { $ne: UserRole.SuperAdmin },
      });
      const totalActive = await adminModel.countDocuments({ isActive: true });
      const totalInactive = await adminModel.countDocuments({
        isActive: false,
      });
      const days = 7; // change as needed
      const since = new Date();
      since.setDate(since.getDate() - days);
      const newestMerchants = await adminModel
        .find({ createdAt: { $gte: since } })
        .sort({ createdAt: -1 });
      const result = await adminModel.aggregate([
        {
          $addFields: {
            avgCommissionRate: { $avg: "$commission_rate" },
          },
        },
        {
          $group: {
            _id: null,
            avgCommissionRate: { $avg: "$avgCommissionRate" },
          },
        },
      ]);
      const avgCommissionRate = result[0]?.avgCommissionRate || 0;
      return c.json({
        total_merchant: totalMerchants,
        total_active_merchant: totalActive,
        total_inactive_merchant: totalInactive,
        newest_merchant: newestMerchants.length,
        avg_commission_rate: avgCommissionRate,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
function getToken(userId: mongoose.Types.ObjectId, store: string) {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  return jwt.sign({ user: userId, store: store }, secret, {
    expiresIn: "24h",
  });
}
function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return null;

  // Convert Unix timestamp to JavaScript Date
  return new Date(decoded.exp * 1000);
}
