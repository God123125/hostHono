import type { Context } from "hono";
import * as z from "zod";
import { orderModel } from "../../models/mobile/order.js";
export const dashboardController = {
  getMostOrderUser: async (c: Context) => {
    try {
      const data = await orderModel.aggregate([
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "mobile_users",
            localField: "user",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: {
            path: "$userData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$user",
            name: { $first: "$userData.name" },
            totalOrder: { $sum: 1 },
            total_cost: { $sum: "$products.subtotal" },
          },
        },
        {
          $sort: { totalOrder: -1 }, // -1 = descending (most orders first)
        },
        {
          $limit: 10,
        },
      ]);
      return c.json({
        data: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getHighIncomeAdmin: async (c: Context) => {
    try {
      const data = await orderModel.aggregate([
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "stores",
            localField: "products.store",
            foreignField: "_id",
            as: "incomeData",
          },
        },
        {
          $unwind: {
            path: "$incomeData",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $group: {
            _id: "$products.store",
            name: { $first: "$incomeData.name" },
            totalOrder: { $sum: 1 },
            total_cost: { $sum: "$products.subtotal" },
          },
        },
        {
          $sort: { totalOrder: -1 }, // -1 = descending (most orders first)
        },
        {
          $limit: 10,
        },
      ]);
      return c.json({
        data: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getRecentOrders: async (c: Context) => {
    try {
      const data = await orderModel.aggregate([
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 10,
        },
      ]);
      return c.json({
        data: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
