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
        owner_name: formData.get("owner_name") as string,
        merchant: formData.get("user") as string,
        store_type: formData.get("store_type") as string,
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
      const storeType = c.req.query("storeType");
      const filter: any = {};
      if (merchantId) filter.merchant = merchantId;
      if (storeType) filter.store_type = storeType;
      const stores = await storeModel
        .find(filter)
        .populate({
          path: "merchant",
          select: ["-profile.data", "-password"],
        })
        .populate({
          path: "store_type",
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
      const pipeline = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "products.store",
            as: "orderData",
          },
        },
        {
          $unwind: {
            path: "$orderData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$orderData._id",
            totalIncome: { $sum: "$orderData.products.subtotal" },
            totalOrder: { $sum: 1 },
          },
        },
      ];
      const data = await storeModel.aggregate(pipeline);
      return c.json({
        data: data,
      });
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
