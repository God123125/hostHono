import type { Context } from "hono";
import categoryModel from "../models/test.js";
import { Category } from "../models/test.js";
import * as z from "zod";
const testService = {
  get: async (c: Context) => {
    try {
      const categories = await categoryModel.find();
      return c.json({
        list: categories,
      });
    } catch (e) {
      return c.json({
        msg: e,
      });
    }
  },
  create: async (c: Context) => {
    try {
      const body = await c.req.json();
      Category.parse(body);
      const categories = new categoryModel(body);
      categories.save();
      return c.json({
        msg: "Category created successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
    }
  },
};
export default testService;
