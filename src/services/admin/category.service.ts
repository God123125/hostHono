import type { Context } from "hono";
import categoryModel from "../../models/admin/category.js";
import { Category } from "../../models/admin/category.js";
import * as z from "zod";
const categoryController = {
  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      body.isActive = true;
      body.store_id = c.get("store");
      const savedData = await categoryModel.create(body);
      return c.json({
        msg: "Category created successfully!",
        data: savedData,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getManyForAdmin: async (c: Context) => {
    try {
      const store_id = c.get("store")?.toString();
      const categories = await categoryModel.find({ store_id: store_id });
      if (categories) {
        return c.json({
          list: categories,
        });
      } else {
        return c.json({
          msg: "empty!",
        });
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const category = await categoryModel.findById(id);
      if (category) {
        return c.json(category);
      } else {
        return c.json("Category not found!");
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const updated = await categoryModel.findByIdAndUpdate(id, body, {
        new: true,
      });
      return c.json({
        msg: "Category update successfully!",
        data: updated,
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
      await categoryModel.findByIdAndDelete(id);
      return c.json({
        msg: "Category deleted successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const q = decodeURIComponent(c.req.query("q") as string);
      const store = c.get("store");
      const data = await categoryModel.find({
        name: { $regex: q.toString().trim(), $options: "i" },
        store_id: store,
      });
      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  //function for mobile app
  getManyForMobile: async (c: Context) => {
    try {
      const storeId = c.req.query("store");
      const categories = await categoryModel
        .find({
          store_id: storeId,
        })
        .select("-store_id");
      return c.json({
        list: categories,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
export default categoryController;
