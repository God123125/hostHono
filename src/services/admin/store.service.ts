import type { Context } from "hono";
import storeModel from "../../models/admin/store.js";
import { Store } from "../../models/admin/store.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      Store.parse(body);
      const store = new storeModel(body);
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
      const user = c.req.query("userId");
      if (!user) {
        return c.json({ msg: "User ID is required" }, 400);
      }
      const stores = await storeModel
        .find({
          user: user,
        })
        .populate("user");
      return c.json({
        list: stores,
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
      const body = await c.req.json();
      Store.parse(body);
      await storeModel.findByIdAndUpdate(id, body);
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
