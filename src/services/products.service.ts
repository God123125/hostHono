import type { Context } from "hono";
import { Product } from "../models/products.js";
import productModel from "../models/products.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const body = c.req.json();
      Product.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
    }
  },
};
export default controller;
