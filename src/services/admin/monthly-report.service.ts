import type { Context } from "hono";
import { orderModel, Order } from "../../models/mobile/order.js";
import { orderStatus } from "../../enum/order-status.enum.js";
export const monthlyReport = {
  monthlyReport: async (c: Context) => {
    try {
      const report = await orderModel.aggregate([
        {
          // Optional: only count completed orders
          $match: { status: orderStatus.completed },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            totalOrders: { $sum: 1 },
            totalIncome: { $sum: "$total" },
          },
        },
        { $sort: { _id: -1 } },
      ]);

      return c.json(report);
    } catch (err) {
      console.error(err);
      return c.json({ message: "Server error" }, 500);
    }
  },
};
