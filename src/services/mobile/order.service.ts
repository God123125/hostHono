import type { Context } from "hono";
import { orderModel } from "../../models/mobile/order.js";
import { Order } from "../../models/mobile/order.js";
import * as z from "zod";
export const orderController = {
  checkOut: async (c: Context) => {
    try {
      const req: Order = await c.req.json();
      const total = req.products.reduce(
        (acc: number, ele) => acc + ele.subtotal,
        0
      );
      const body = {
        user: req.user,
        total: total,
        delivery_fee: req.delivery_fee,
        products: req.products,
        status: "pending",
        payment_method: "Cash On delivery",
      };
      const validated = Order.parse(body);
      const created = await orderModel.create(validated);
      return c.json({
        msg: "Checkouted",
        data: created,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  order: async (c: Context) => {
    try {
      const req = await c.req.json();
      const id = c.req.param("id");
      const payment = req.payment_method;
      const body = {
        payment_method: payment,
      };
      const updated = await orderModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "Order started",
        data: updated,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  confirmOrder: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const status = "Completed";
      const body = {
        status: status,
      };
      const updated = await orderModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "Order started",
        data: updated,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  deleteOrder: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await orderModel.findByIdAndDelete(id);
      return c.json({
        msg: "Order deleted",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOrder: async (c: Context) => {
    try {
      const userId = c.req.query("userId");
      let status = "pending";
      const order = await orderModel.find({
        status: status,
        user: userId,
      });
      return c.json(order);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getList: async (c: Context) => {
    try {
      const userId = c.req.query("userId");
      const order = await orderModel.find({
        user: userId,
      });
      return c.json(order);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
