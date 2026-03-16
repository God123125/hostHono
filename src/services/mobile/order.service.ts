import type { Context } from "hono";
import { orderModel } from "../../models/mobile/order.js";
import { Order } from "../../models/mobile/order.js";
import { cartModel } from "../../models/mobile/cart.js";
import { orderStatus } from "../../enum/order-status.enum.js";
import * as z from "zod";
import { commissionModel } from "../../models/admin/commission.js";
import mongoose, { Types } from "mongoose";
export const orderController = {
  checkOut: async (c: Context) => {
    try {
      const req = await c.req.json();
      const cartId = req.cartId;
      const total = req.products.reduce(
        (acc: number, ele: any) => acc + ele.subtotal,
        0,
      );
      const body = {
        user: c.get("user"),
        total: total + req.delivery_fee,
        delivery_fee: req.delivery_fee,
        products: req.products,
        status: orderStatus.pending,
        payment_method: req.payment_method,
        remark: req.remark,
        estimate_delivery_time: req.estimate_delivery_time,
        total_discount: req.total_discount,
      };
      const validated = Order.parse(body);
      const created = await orderModel.create(validated);
      await cartModel.findByIdAndDelete(cartId);
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
  // this one is used for confirm order or cancel it
  endOrder: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { isConfirmOrder } = await c.req.json();
      let status = "";
      if (isConfirmOrder) {
        status = orderStatus.completed;
        const data = await orderModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(id) },
          },
          {
            $unwind: "$products",
          },
          {
            $addFields: {
              "products.store": { $toObjectId: "$products.store" },
            },
          },
          {
            $lookup: {
              from: "stores",
              localField: "products.store",
              foreignField: "_id",
              as: "storeDetails",
            },
          },
          {
            $unwind: "$storeDetails",
          },
          {
            $addFields: {
              "storeDetails.merchant": {
                $toObjectId: "$storeDetails.merchant",
              },
            },
          },
          {
            $lookup: {
              from: "admins",
              localField: "storeDetails.merchant",
              foreignField: "_id",
              as: "merchantDetails",
            },
          },

          {
            $unwind: "$merchantDetails",
          },
          {
            $project: {
              orderId: "$_id",
              product: "$products",
              store: "$storeDetails",
              merchant: "$merchantDetails._id",
              merchantName: "$merchantDetails.name",
              commissionRate: "$merchantDetails.commission_rate",
              productPrice: "$products.price",
              quantity: "$products.qty",
            },
          },
        ]);
        const commissions = data.map((item) => {
          const saleAmount = item.productPrice * item.quantity;
          const rate = item.commissionRate ? item.commissionRate : 0.1; // ✅ now correctly referenced

          return {
            merchant: item.merchant.toString(),
            amount: (saleAmount * rate).toFixed(2),
            rate: rate,
            status: "pending",
          };
        });
        await commissionModel.insertMany(commissions);
      } else {
        status = orderStatus.canceled;
      }
      const body = {
        status: status,
      };
      const updated = await orderModel.findByIdAndUpdate(id, body, {
        new: true,
      });
      return c.json({
        msg: "Order completed",
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
      let status = orderStatus.pending;
      const order = await orderModel
        .find({
          status: status,
          user: c.get("user"),
        })
        .sort({ createdAt: 1 });
      return c.json({
        list: order,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getList: async (c: Context) => {
    try {
      const data = await orderModel.aggregate([
        { $match: { user: c.get("user") } },
        { $unwind: "$products" },
        {
          $lookup: {
            from: "stores",
            localField: "products.store",
            foreignField: "_id",
            as: "products.store",
          },
        },
        { $unwind: "$products.store" }, // flatten the array from $lookup
        {
          $project: {
            "products.store.store_img": 0, // was "stores.store_img" (wrong path)
          },
        },
        {
          $sort: { createdAt: -1 }, // was "$createdAt" (wrong, no $ prefix on field names)
        },
        {
          $group: {
            // re-group products back after $unwind
            _id: "$_id",
            user: { $first: "$user" },
            products: { $push: "$products" },
            delivery_fee: { $first: "$delivery_fee" },
            total: { $first: "$total" },
            status: { $first: "$status" },
            payment_method: { $first: "$payment_method" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
          },
        },
        { $sort: { createdAt: -1 } }, // sort again after $group
      ]);
      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStats: async (c: Context) => {
    try {
      const store = new Types.ObjectId(c.get("store"));
      console.log(store);
      const data = await orderModel.aggregate([
        {
          $match: { "products.store": store },
        },
        {
          $unwind: "$products",
        },
        {
          $match: { "products.store": store },
        },
        {
          $group: {
            _id: null,
            total_income: { $sum: "$products.subtotal" },
            total_pending: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
              },
            },
            total_cancels: {
              $sum: {
                $cond: [{ $eq: ["$status", "canceled"] }, 1, 0],
              },
            },
            total_completed: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },
            total_orders: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            total_income: 1,
            total_pending: 1,
            total_completed: 1,
            total_orders: 1,
            total_canceled: 1,
          },
        },
      ]);

      // ✅ Fallback to 0 if no data found
      const result = data[0] ?? {
        total_income: 0,
        total_pending: 0,
        total_completed: 0,
        total_canceled: 0,
        total_orders: 0,
      };

      return c.json(result);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
