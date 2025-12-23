import type { Context } from "hono";
import { orderModel } from "../../models/mobile/order.js";
import { Order } from "../../models/mobile/order.js";
import * as z from "zod";
export const orderController = {
  create: async (c: Context) => {
    try {
      const req = await c.req.json();
      const sub_total = req.qty * req.price;
      const products = {
        ...req,
        subtotal: sub_total,
      };
      const body = {};
      const validated = Order.parse(body);
      const created = await orderModel.create(validated);
      return c.json({
        msg: "Order started",
        data: created,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
};
