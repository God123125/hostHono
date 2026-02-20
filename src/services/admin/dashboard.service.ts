import type { Context } from "hono";
import { orderModel } from "../../models/mobile/order.js";
import mongoose from "mongoose";
export const dashboardController = {
  getMostOrderUser: async (c: Context) => {
    try {
      const data = await orderModel.aggregate([
        {
          $addFields: {
            userObjectId: { $toObjectId: "$user" }, // convert string → ObjectId
          },
        },
        {
          $unwind: "$products",
        },
        {
          $lookup: {
            from: "mobile_users",
            localField: "userObjectId",
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
          $match: {
            _id: new mongoose.Types.ObjectId("6998537fe637c20be3fe8bd0"), // test with just this order
          },
        },
        {
          $unwind: "$products",
        },
        {
          $addFields: {
            storeObjectId: {
              $convert: {
                input: "$products.store",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "stores",
            localField: "storeObjectId",
            foreignField: "_id",
            as: "incomeData",
          },
        },
        {
          $unwind: {
            path: "$incomeData",
            preserveNullAndEmptyArrays: true, // ← change to true temporarily
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
