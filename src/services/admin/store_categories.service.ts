import type { Context } from "hono";
import { storeCategoryModel } from "../../models/admin/store_categories.js";
import { storeCategory } from "../../models/admin/store_categories.js";
import * as z from "zod";
export const storeCategoryController = {
  create: async (c: Context) => {
    try {
      const body = c.req.json();
      const validated = storeCategory.parse(body);
      const created = await storeCategoryModel.create(validated);
      return c.json({
        msg: "Store category created successfully!",
        data: created,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const categories = await storeCategoryModel.find();
      return c.json({
        list: categories,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const category = await storeCategoryModel.findById(id);
      return c.json(category);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = c.req.json();
      await storeCategoryModel.findByIdAndUpdate(id, body, { new: true });
      return c.json({
        msg: "Store category updated successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await storeCategoryModel.findByIdAndDelete(id);
      return c.json({
        msg: "Store category deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await storeCategoryModel.find({
        name: { $regex: search, $options: "i" },
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
