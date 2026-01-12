import type { Context } from "hono";
import {
  feedbackModel,
  feedback,
} from "../../models/mobile/customer-feedback.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const body = c.req.json();
      const validated = feedback.parse(body);
      await feedbackModel.create(validated);
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
        .populate([{ path: "user" }, { path: "store" }]);
      return c.json({
        list: feedbacks,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
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
