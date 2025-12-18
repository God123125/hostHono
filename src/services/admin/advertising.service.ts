import type { Context } from "hono";
import advertisingModel from "../../models/admin/advertising.js";
import { advertising } from "../../models/admin/advertising.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();
      const body: advertising = {
        image: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
        des: formData.get("des") as string,
        isActive: formData.get("isActive") == "true",
      };
      const validated = advertising.parse(body);
      const ads = new advertisingModel(validated);
      return c.json({
        msg: "Advertising created successfully!",
        data: ads,
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
      const ads = await advertisingModel.find().select("-image.data");
      return c.json({
        list: ads,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const image = await advertisingModel.findById(id).select("image");
      if (image) {
        return c.body(image.image.data, 200, {
          "content-type": image.image.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const ad = await advertisingModel.findById(id);
      if (ad) {
        return c.json(ad);
      } else {
        return c.json({});
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {},
};
export default controller;
