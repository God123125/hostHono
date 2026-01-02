import type { Context } from "hono";
import { Cart, cartModel } from "../../models/mobile/cart.js";
import * as z from "zod";
export const cartController = {
  create: async (c: Context) => {
    try {
      const req = await c.req.json();
      const body = {
        ...req,
        total: req.qty * req.price,
        user: c.get("user"),
      };
      const validated = Cart.parse(body);
      const products = await cartModel.create(validated);
      return c.json({
        msg: "Product added to cart successfully!",
        data: products,
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
      // const userId = c.req.query("userId");
      const carts = await cartModel.find({ user: c.get("user") });
      const length = carts.length;
      return c.json({
        list: carts,
        total: length,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const cart = await cartModel.findById(id);
      if (cart) {
        return c.json(cart);
      } else {
        return c.json({
          msg: "Cart is empty",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const req = await c.req.json();
      const updated = await cartModel.findByIdAndUpdate(id, req);
      return c.json({
        msg: "Cart updated successfully!",
        data: updated,
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
      await cartModel.findByIdAndDelete(id);
      return c.json({
        msg: "Cart delete successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
