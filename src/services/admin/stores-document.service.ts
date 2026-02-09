import type { Context } from "hono";
import storeDocModel, { storeDoc } from "../../models/admin/stores-document.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const storeId = c.req.param("id");
      const existingImage = await storeDocModel.findOne({
        store_id: storeId,
      });
      if (existingImage) {
        return c.json({
          msg: "Image existed please delete the old one first!",
        });
      } else {
        const file = formData.get("image") as File;
        const buffer = await file.arrayBuffer();
        const store_doc = {
          store_id: storeId,
          image: {
            filename: file.name,
            mimetype: file.type,
            data: Buffer.from(buffer),
            length: file.size,
          },
        };
        const validated = storeDoc.parse(store_doc);
        await storeDocModel.create(validated);
        return c.json({
          msg: "File uploaded successfully!",
        });
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getByStoreId: async (c: Context) => {
    try {
      const storeId = c.req.param("id");
      const img = await storeDocModel
        .findOne({ store_id: storeId })
        .select("image");
      if (img) {
        return c.body(img!.image.data, 200, {
          "Content-Type": img!.image.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const storeId = c.req.param("id");
      const img = await storeDocModel.findOne({ store_id: storeId });
      if (img) {
        await img.deleteOne();
        return c.json({
          msg: "Image deleted successfully!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const storeId = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();
      const store_doc = {
        image: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
      };
      const foundImage = await storeDocModel.findOne({
        store_id: storeId,
      });
      if (foundImage) {
        await foundImage.updateOne(store_doc);
        return c.json({
          msg: "Update successfully!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
export default controller;
