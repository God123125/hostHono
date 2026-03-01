import type { Context } from "hono";
import { storeModel } from "../../models/admin/stores.js";
import { Store } from "../../models/admin/stores.js";
import * as z from "zod";
import path from "path";
import { readFile } from "fs/promises";
import mongoose from "mongoose";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("store_img") as File;
      const body: Store = {
        name: formData.get("name") as string,
        merchant: formData.get("merchant") as string,
        store_category: formData.get("store_category") as string,
        isActive: formData.get("isActive") == "true",
      };
      if (file && file.size > 0) {
        // User uploaded a profile image
        const buffer = await file.arrayBuffer();
        body.store_img = {
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
          "default_store_category.jpg",
        );
        try {
          const defaultBuffer = await readFile(defaultImagePath);
          body.store_img = {
            filename: "default_store_category.jpg",
            mimetype: "image/jpg",
            data: defaultBuffer,
            length: defaultBuffer.length,
          };
        } catch (error) {
          console.log("Default image not found at:", defaultImagePath);
        }
      }
      const validated = Store.parse(body);
      const store = new storeModel(validated);
      await store.save();
      return c.json({
        msg: "Store created successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const merchantId = c.req.query("merchantId");
      const storeCategory = c.req.query("storeCategory");
      const filter: any = {};
      if (merchantId) filter.merchant = merchantId;
      if (storeCategory) filter.store_category = storeCategory;
      const stores = await storeModel
        .find(filter)
        .populate({
          path: "merchant",
          select: ["-profile.data", "-password"],
        })
        .populate({
          path: "store_category",
          select: "-image.data",
        })
        .select("-store_img.data")
        .lean();
      const count = stores.length;
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedData = stores.map((el) => {
        return {
          ...el,
          image_url: `${baseUrl}/api/stores/store-image/${el._id}`,
        };
      });
      return c.json({
        list: formattedData,
        total: count,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getDetailForAdmin: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const pipeline = [
        // ===============================
        // 1️⃣ MATCH STORE
        // ===============================
        {
          $match: { _id: new mongoose.Types.ObjectId(id) },
        },

        // ===============================
        // 2️⃣ LOOKUP ORDERS (UNCHANGED LOGIC)
        // ===============================
        {
          $lookup: {
            from: "orders",
            let: { storeId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$$storeId", "$products.store"],
                  },
                },
              },
            ],
            as: "orderData",
          },
        },

        { $unwind: { path: "$orderData", preserveNullAndEmptyArrays: false } },
        { $unwind: "$orderData.products" },

        {
          $match: {
            $expr: {
              $eq: ["$orderData.products.store", { $toString: "$_id" }],
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            name: { $first: "$name" },
            merchant: { $first: "$merchant" },
            totalIncome: { $sum: "$orderData.products.subtotal" },
            totalOrder: { $addToSet: "$orderData._id" },
          },
        },

        // ===============================
        // 3️⃣ MERCHANT
        // ===============================
        {
          $addFields: {
            merchantObjId: { $toObjectId: "$merchant" },
          },
        },

        {
          $lookup: {
            from: "merchants",
            localField: "merchantObjId",
            foreignField: "_id",
            as: "merchant",
          },
        },

        {
          $unwind: {
            path: "$merchant",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ===============================
        // 4️⃣ PRODUCT COUNT
        // ===============================
        {
          $addFields: {
            storeId: { $toString: "$_id" },
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "storeId",
            foreignField: "store",
            as: "productData",
          },
        },

        {
          $addFields: {
            totalOrder: { $size: "$totalOrder" },
            totalProduct: { $size: "$productData" },
          },
        },

        // ===============================
        // 5️⃣ COMMISSION (ONLY PAID)
        // ===============================
        {
          $lookup: {
            from: "commissions",
            let: { merchantId: { $toString: "$merchantObjId" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$merchant", "$$merchantId"] },
                      { $eq: ["$status", "paid"] }, // ✅ only paid commission
                    ],
                  },
                },
              },
            ],
            as: "commission",
          },
        },

        {
          $unwind: {
            path: "$commission",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            store_img: {
              $concat: [
                `${baseUrl}/api/stores/store-image/`,
                { $toString: "$_id" },
              ],
            },
            merchant_profile: {
              $concat: [
                `${baseUrl}/api/merchants/profile/`,
                { $toString: "$merchantObjId" },
              ],
            },
            commission_paid: {
              $sum: "$commission.amount",
            },
          },
        },
        // ===============================
        // 6️⃣ CLEAN OUTPUT
        // ===============================
        {
          $project: {
            productData: 0,
            storeId: 0,
            merchantObjId: 0,
            orderData: 0,
            "merchant.profile": 0,
          },
        },
      ];
      const data = await storeModel.aggregate(pipeline);
      const detail = data[0];
      return c.json(detail);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const store = await storeModel
        .findById(id)
        .select("-image.data")
        .populate("merchant")
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedData = {
        ...store,
        image_url: `${baseUrl}/api/store/store-image/${store?._id}`,
      };
      return c.json(formattedData);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  updateInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      await storeModel.findByIdAndUpdate(id, body, { new: true });
      return c.json({
        msg: "Store updated successfully!",
      });
    } catch (e) {
      console.log(e);
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  updateStoreImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("store_img") as File;
      const body: any = {};
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.store_img = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }
      if (!body.store_img) {
        return c.json({ msg: "Please input file" }, 400);
      }
      await storeModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "Store image updated successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getStoreImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const image = await storeModel.findById(id).select("store_img");
      if (image && image.store_img && image.store_img.data) {
        return c.body(image!.store_img.data, 200, {
          "Content-Type": image!.store_img.mimetype,
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
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await storeModel.findByIdAndDelete(id);
      return c.json({
        msg: "Store deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string); // decodeURIComponent prer somrap search ahsor khmer
      const store = await storeModel.find({
        name: { $regex: search, $options: "i" },
      });
      if (store.length > 0) {
        return c.json({
          data: store,
        });
      } else {
        return c.json({
          msg: "Store not found!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
export default controller;
