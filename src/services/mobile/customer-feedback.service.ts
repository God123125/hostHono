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
        const defaultImagePath = path.join(
          process.cwd(),
          "src",
          "images",
          "default-product.png",
        );
        try {
          const defaultBuffer = await readFile(defaultImagePath);
          body.img_feedback = {
            filename: "default_store_category.jpg",
            mimetype: "image/jpg",
            data: defaultBuffer,
            length: defaultBuffer.length,
          };
        } catch (error) {
          console.log("Default image not found at:", defaultImagePath);
        }
      }
      await feedbackModel.create(body);
      return c.json({
        msg: "Feedback done!",
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
      const feedbacks = await feedbackModel
        .find()
        .populate([
          { path: "user", select: ["-profile", "-password", "-address"] },
          { path: "store", select: "-store_img" },
        ])
        .select("-img_feedback")
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedFeedback = feedbacks.map((el) => {
        return {
          ...el,
          feedback_img: `${baseUrl}/api/feedbacks/img/${el._id}`,
        };
      });
      return c.json({
        list: formattedFeedback,
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
};
export default controller;
