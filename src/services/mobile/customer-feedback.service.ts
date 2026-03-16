import type { Context } from "hono";
import {
  feedbackModel,
  feedback,
} from "../../models/mobile/customer-feedback.js";
import * as z from "zod";
import path from "path";
import { readFile } from "fs/promises";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("img_feedback") as File;
      const user = await c.get("user");
      const body: any = {
        star: Number(formData.get("star")) || 0,
        description: formData.get("description") as string,
        user: user,
        store: formData.get("store") as string,
      };
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.img_feedback = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      } else {
        const imageUrl = `${process.env.APP_URL}/images/default-product.png`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.log("Failed to fetch default image:", response.status);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        body.img_feedback = {
          filename: "default-product.png",
          mimetype: "image/png",
          data: buffer,
          length: buffer.length,
        };
      }
      await feedbackModel.create(body);
      return c.json({
        msg: "Feedback done!",
      });
    } catch (e) {
      console.log(e);
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const store = c.get("store") ? c.get("store") : c.req.query("store");
      const query: any = {};
      if (store) query.store = store;
      const feedbacks = await feedbackModel
        .find(query)
        .populate([
          {
            path: "user",
            select: ["-profile", "-password", "-address", "-role"],
          },
          { path: "store", select: "-store_img" },
        ])
        .select("-img_feedback")
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedFeedback = feedbacks.map((el) => {
        return {
          ...el,
          feedback_img: `${baseUrl}/api/feedbacks/img/${el?._id}`,
          user_profile: `${baseUrl}/api/mobile-users/profile/${(el.user as any)?._id}`,
        };
      });
      return c.json({
        list: formattedFeedback,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const store = c.get("store");
      const searchQuery = c.req.query("q")
        ? decodeURIComponent(c.req.query("q") as string)
        : null;
      const searchMatch = searchQuery
        ? {
            $match: {
              $or: [
                { "user.name": { $regex: searchQuery, $options: "i" } },
                { star: { $eq: Number(searchQuery) } },
              ],
            },
          }
        : null;
      const data = await feedbackModel.aggregate([
        {
          $match: { store: store },
        },
        {
          $addFields: { userObjId: { $toObjectId: "$user" } },
        },
        {
          $lookup: {
            from: "mobile_users",
            localField: "userObjId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
        },
        ...(searchMatch ? [searchMatch] : []),
        {
          $project: {
            img_feedback: 0,
            "user.address": 0,
            "user.password": 0,
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
  searchForAdmin: async (c: Context) => {
    try {
      const searchQuery = c.req.query("q")
        ? decodeURIComponent(c.req.query("q") as string)
        : null;

      const searchMatch = searchQuery
        ? {
            $match: {
              $or: [
                { "user.name": { $regex: searchQuery, $options: "i" } },
                { star: { $eq: Number(searchQuery) } },
              ],
            },
          }
        : null;
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const data = await feedbackModel.aggregate([
        {
          $addFields: {
            userObjId: { $toObjectId: "$user" },
            storeObjId: { $toObjectId: "$store" }, // convert store string → ObjectId
          },
        },
        {
          $lookup: {
            from: "mobile_users",
            localField: "userObjId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
        },

        ...(searchMatch ? [searchMatch] : []),

        {
          $lookup: {
            from: "stores",
            localField: "storeObjId",
            foreignField: "_id",
            as: "store",
          },
        },

        {
          $unwind: { path: "$store", preserveNullAndEmptyArrays: true },
        },

        {
          $addFields: {
            feedback_img: {
              $concat: [`${baseUrl}/api/feedbacks/img/`, { $toString: "$_id" }],
            },
            user_profile: {
              $concat: [
                `${baseUrl}/api/mobile-users/profile/`,
                { $toString: "$user._id" },
              ],
            },
          },
        },

        {
          $project: {
            img_feedback: 0,
            "user.address": 0,
            "user.password": 0,
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
  getFeedbackImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await feedbackModel.findById(id).select("img_feedback");
      if (img && img.img_feedback && img.img_feedback.data) {
        return c.body(img!.img_feedback.data, 200, {
          "Content-Type": img!.img_feedback.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e) {
      console.log(e);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const feedback = await feedbackModel
        .findById(id)
        .populate([{ path: "user" }, { path: "store" }]);
      return c.json(feedback);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await feedbackModel.findByIdAndDelete(id);
      return c.json({
        msg: "Feedback deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getOverallStats: async (c: Context) => {
    try {
      const store_id = c.get("store");
      const matchStage = store_id ? [{ $match: { store: store_id } }] : [];
      const totalFeedbacks = await feedbackModel.countDocuments(
        store_id ? { store: store_id } : {},
      );

      const feedbacks = await feedbackModel.aggregate([
        ...matchStage,
        {
          $group: {
            _id: null,
            average_star: { $avg: "$star" },
            positive_count: {
              $sum: { $cond: [{ $gt: ["$star", 3] }, 1, 0] },
            },
            negative_count: {
              $sum: { $cond: [{ $lt: ["$star", 3] }, 1, 0] },
            },
          },
        },
        {
          $addFields: {
            positive_proportion: {
              $cond: [
                { $gt: [totalFeedbacks, 0] },
                {
                  $multiply: [
                    { $divide: ["$positive_count", totalFeedbacks] },
                    100,
                  ],
                },
                0,
              ],
            },
            negative_proportion: {
              $cond: [
                { $gt: [totalFeedbacks, 0] },
                {
                  $multiply: [
                    { $divide: ["$negative_count", totalFeedbacks] },
                    100,
                  ],
                },
                0,
              ],
            },
          },
        },
      ]);

      const result = feedbacks[0] ?? {
        average_star: 0,
        positive_count: 0,
        negative_count: 0,
        positive_proportion: 0,
        negative_proportion: 0,
      };
      return c.json({
        total_feedback: totalFeedbacks,
        calculate_average: result,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
export default controller;
