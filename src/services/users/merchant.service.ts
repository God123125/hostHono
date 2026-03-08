import type { Context } from "hono";
import * as z from "zod";
import bcrpyt from "bcrypt";
import jwt from "jsonwebtoken";
import { Merchant, merchantModel } from "../../models/users/merchants.js";
import { readFile } from "fs/promises";
import path from "path";
import { orderModel } from "../../models/mobile/order.js";
import { storeModel } from "../../models/users/stores.js";
import mongoose from "mongoose";
import { commissionModel } from "../../models/users/commission.js";
export const merchantController = {
  createMerchant: async (c: Context) => {
    try {
      const salt = await bcrpyt.genSalt();
      // Expect JSON body. Optional `profile` may be a base64 string or an object { filename, mimetype, data }
      const bodyData: any = await c.req.json();
      const password = bodyData.password;
      const hashPass = await bcrpyt.hash(password as string, salt);
      const body: any = {
        name: bodyData.name as string,
        username: bodyData.username as string,
        email: bodyData.email as string,
        password: hashPass,
        role: bodyData.role as string,
        phone: bodyData.phone as string,
        address: bodyData.address as string,
        commission_rate: Number(bodyData.commission_rate) || 0,
        isActive: bodyData.isActive !== undefined ? Boolean(bodyData.isActive) : true,
      };

      // Handle optional profile in JSON (base64 or object)
      if (bodyData.profile) {
        try {
          let buffer: Buffer | null = null;
          let filename = bodyData.profile_filename || "profile.png";
          let mimetype = bodyData.profile_mimetype || "image/png";

          if (typeof bodyData.profile === "string") {
            // plain base64 string or data URL
            const b64 = (bodyData.profile as string).replace(/^data:.*;base64,/, "");
            buffer = Buffer.from(b64, "base64");
          } else if (typeof bodyData.profile === "object" && bodyData.profile.data) {
            const p = bodyData.profile as any;
            const b64 = (p.data as string).replace(/^data:.*;base64,/, "");
            buffer = Buffer.from(b64, "base64");
            filename = p.filename || filename;
            mimetype = p.mimetype || mimetype;
          }

          if (buffer) {
            body.profile = {
              filename,
              mimetype,
              data: buffer,
              length: buffer.length,
            };
          }
        } catch (err) {
          console.log("Failed to parse profile from JSON:", err);
        }
      }

      // If no profile provided or parsing failed, use default image
      if (!body.profile) {
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
            data: Buffer.from(defaultBuffer),
            length: defaultBuffer.length,
          };
        } catch (error) {
          console.log("Default image not found at:", defaultImagePath);
        }
      }

      await merchantModel.create(body);
      return c.json({ msg: "Merchant created successfully!" });
    } catch (e) {
      console.log(e);
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const merchants = await merchantModel.aggregate([
        {
          $project: {
            "profile.data": 0,
          },
        },
        {
          $addFields: {
            merchantIdStr: { $toString: "$_id" },
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
  getProfile: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await merchantModel.findById(id).select("profile");
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
  getMerchantDetail: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const data = await merchantModel.aggregate([
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
              $concat: [
                `${baseUrl}/api/merchants/profile/`,
                { $toString: "$_id" },
              ],
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
  updateAccountInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const {
        name,
        username,
        email,
        password,
        role,
        phone,
        isActive,
        address,
      } = await c.req.json();

      const hashedPassword = password
        ? await bcrpyt.hash(password, await bcrpyt.genSalt(10))
        : undefined;

      const body = Object.fromEntries(
        Object.entries({
          name,
          username,
          email,
          password: hashedPassword,
          role,
          phone,
          address,
          isActive,
        }).filter(([_, v]) => v !== undefined),
      );

      await merchantModel.findByIdAndUpdate(id, body, { new: true });

      return c.json({ msg: "Merchant updated successfully!" });
    } catch (e) {
      console.log(e);
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
        return c.json({ msg: "No image provided" }, 400);
      }
      await merchantModel.findByIdAndUpdate(id, body, { new: true });
      return c.json({ msg: "Profile updated successfully!" });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await merchantModel.findByIdAndDelete(id);
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
      const data = await merchantModel.find({
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
      const totalMerchants = await merchantModel.countDocuments();
      const totalActiveMerchants = await merchantModel.countDocuments({
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

  login: async (c: Context) => {
    try {
      const { email, password } = await c.req.json();
      const user = await merchantModel.findOne({ email });
      if (!user) return c.json({ message: "Unauthenticated" }, 401);
      const store = await storeModel.findOne({
        merchant: user._id.toString(),
      });
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;

      const userBody = {
        fullname: (user as any).name || user.username || "",
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_url: user.profile
          ? `${baseUrl}/api/merchants/profile/${user._id}`
          : null,
        store: store?._id,
      };
      const compare = await bcrpyt.compare(password, user.password);
      if (!compare) return c.json({ message: "Wrong password!" }, 401);
      const token = getToken(user._id);
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
};
function getToken(userId: mongoose.Types.ObjectId) {
  const secret = process.env.JWT_KEY;
  if (!secret) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  return jwt.sign({ user: userId }, secret, {
    expiresIn: "24h",
  });
}
function getExpirationDate(token: string): Date | null {
  const decoded = jwt.decode(token) as { exp?: number };
  if (!decoded?.exp) return null;

  // Convert Unix timestamp to JavaScript Date
  return new Date(decoded.exp * 1000);
}
