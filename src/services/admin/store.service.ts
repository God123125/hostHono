import type { Context } from "hono";
import storeModel from "../../models/admin/store.js";
import { Store } from "../../models/admin/store.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("store_img") as File;
      const buffer = await file.arrayBuffer();
      const body: Store = {
        name: formData.get("name") as string,
        owner_name: formData.get("owner_name") as string,
        gender: formData.get("gender") as string,
        phone: formData.get("phone") as string,
        user: formData.get("user") as string,
        store_type: formData.get("store_type") as string,
        isActive: formData.get("isActive") == "true",
        store_img: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
      };
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
      const userId = c.req.query("userId");
      const storeType = c.req.query("storeType");
      const filter: any = {};
      if (userId) filter.user = userId;
      if (storeType) filter.store_type = storeType;
      const stores = await storeModel
        .find(filter)
        .populate({
          path: "user",
          select: ["-profile.data", "-password"],
        })
        .select("-store_img.data");
      const count = stores.length;
      return c.json({
        list: stores,
        total: count,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const store = await storeModel.findById(id).populate("user");
      return c.json(store);
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
      if (image) {
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
