import type { Context } from "hono";
import storeModel from "../../models/admin/store.js";
import store, { Store } from "../../models/admin/store.js";
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
        email: formData.get("email") as string,
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
      const savedData = await store.save();
      return c.json({
        msg: "Store created successfully!",
        data: savedData,
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
        .populate("user")
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
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("store_img") as File;
      const buffer = await file.arrayBuffer();
      const body: Store = {
        name: formData.get("name") as string,
        owner_name: formData.get("owner_name") as string,
        gender: formData.get("gender") as string,
        email: formData.get("email") as string,
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
      await storeModel.findByIdAndUpdate(id, validated);
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
};
export default controller;
