import { productDoc } from "../../models/admin/products-document.js";
import * as z from "zod";
import productDocModel from "../../models/admin/products-document.js";
import type { Context } from "hono";
export const productDocController = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const productId = c.req.param("proId");
      const existingImage = await productDocModel.findOne({
        product_id: productId,
      });
      if (existingImage) {
        return c.json({
          msg: "Image existed please delete the old one first!",
        });
      } else {
        const file = formData.get("image") as File;
        const buffer = await file.arrayBuffer();
        const product_doc = {
          product_id: productId,
          image: {
            filename: file.name,
            mimetype: file.type,
            data: Buffer.from(buffer),
            length: file.size,
          },
        };
        const validated = productDoc.parse(product_doc);
        await productDocModel.create(validated);
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
  getByProductId: async (c: Context) => {
    try {
      const productId = c.req.param("proId");
      const img = await productDocModel
        .findOne({ product_id: productId })
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
      const productId = c.req.param("proId");
      const img = await productDocModel.findOne({ product_id: productId });
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
      const productId = c.req.param("proId");
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();
      const product_doc = {
        image: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
      };
      const foundImage = await productDocModel.findOne({
        product_id: productId,
      });
      if (foundImage) {
        await foundImage.updateOne(product_doc);
        return c.json({
          msg: "Update successfully!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
