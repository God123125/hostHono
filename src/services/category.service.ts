import type { Context } from "hono";
import categoryModel from "../models/category.js";
import { Category } from "../models/category.js";
import * as z from "zod";
const categoryController = {
  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      Category.parse(body);
      const category = new categoryModel(body);
      category.save();
      return c.json({
        msg: "Category created successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
    }
  },
  get: async (c: Context) => {
    try {
      const categories = await categoryModel.find();
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
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      Category.parse(body);
      await categoryModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "Category update successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
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
    }
  },
};
export default categoryController;
