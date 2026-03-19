import type { Context } from "hono";
import { orderModel } from "../../models/mobile/order.js";
import mongoose, { Types } from "mongoose";
import { commissionModel } from "../../models/admin/commission.js";
import { adminModel } from "../../models/admin/merchants.js";
import { UserRole } from "../../enum/user-role.enum.js";
import { storeModel } from "../../models/admin/stores.js";
import { mobileUserModel } from "../../models/mobile/mobile-user.js";
import categoryModel from "../../models/admin/category.js";
import productModel from "../../models/admin/products.js";
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
    const showAll = c.req.query("showAll");
    try {
      const pipeline: any[] = [
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
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            merchantObjectId: {
              $convert: {
                input: "$incomeData.merchant",
                to: "objectId",
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "admins",
            localField: "merchantObjectId", // ✅ Use converted field
            foreignField: "_id",
            as: "adminData",
          },
        },
        {
          $unwind: {
            path: "$adminData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$products.store",
            store_name: { $first: "$incomeData.name" },
            merchant_name: { $first: "$adminData.fullname" },
            total_order: { $sum: 1 },
            total_income: { $sum: "$products.subtotal" },
          },
        },
        {
          $sort: { total_income: -1 },
        },
      ];
      if (showAll !== "true") {
        pipeline.push({ $limit: 5 });
      }

      const data = await orderModel.aggregate(pipeline);

      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getRecentOrders: async (c: Context) => {
    try {
      const store = await c.get("store");
      const store_id = new Types.ObjectId(store);
      const data = await orderModel.aggregate([
        {
          $match: {
            "products.store": store_id,
          },
        },
        {
          $addFields: {
            userObjectId: { $toObjectId: "$user" },
          },
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
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
      ]);
      return c.json({ list: data });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStatsForAdminDashboard: async (c: Context) => {
    try {
      const paidCommissions = await commissionModel
        .find({ status: "paid" })
        .lean();
      const totalCommission = paidCommissions.reduce(
        (init: any, acc: any) => init + acc.amount,
        0,
      );
      const totalStores = await storeModel.find();
      const totalMobileUsers = await mobileUserModel.find();
      const totalMerchants = await adminModel.find({
        role: { $ne: UserRole.SuperAdmin },
      });
      return c.json({
        total_commission: totalCommission,
        total_stores: totalStores.length,
        total_mobile_users: totalMobileUsers.length,
        total_merchants: totalMerchants.length,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStatForAdminBarChart: async (c: Context) => {
    try {
      const data = await storeModel.aggregate([
        {
          $addFields: { idAsString: { $toString: "$_id" } },
        },
        {
          $lookup: {
            from: "products",
            localField: "idAsString",
            foreignField: "store",
            as: "productData",
          },
        },
        {
          $addFields: {
            productCount: { $size: "$productData" },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            productCount: { $size: "$productData" },
          },
        },
      ]);
      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStatForMerchantBarChart: async (c: Context) => {
    try {
      const store_id = new Types.ObjectId(c.get("store"));
      const data = await categoryModel.aggregate([
        {
          $match: { store_id: store_id },
        },
        {
          $addFields: { idAsString: { $toString: "$_id" } },
        },
        {
          $lookup: {
            from: "products",
            localField: "idAsString",
            foreignField: "category",
            as: "productData",
          },
        },
        {
          $addFields: {
            productCount: { $size: "$productData" },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            productCount: { $size: "$productData" },
          },
        },
      ]);
      return c.json({
        list: data,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStatForMerchantStatCard: async (c: Context) => {
    try {
      const store_id = new Types.ObjectId(c.get("store"));
      const totalProducts = await productModel.countDocuments({
        store: c.get("store"),
      });
      const data = await orderModel.aggregate([
        {
          $unwind: "$products",
        },
        { $match: { "products.store": store_id } },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: "$total" },
            totalOrder: { $sum: 1 },
          },
        },
        {
          $addFields: {
            averageProductsPerOrder: {
              $cond: [
                { $gt: [totalProducts, 0] },
                { $divide: ["$totalOrder", totalProducts] },
                0,
              ],
            },
          },
        },
      ]);

      const result = data[0] ?? {
        totalIncome: 0,
        totalOrder: 0,
        averageProductsPerOrder: 0,
      };

      return c.json({ ...result, totalProducts });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
