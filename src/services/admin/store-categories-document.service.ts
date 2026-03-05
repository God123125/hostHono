import * as z from "zod";
import storeCateDocModel, {
  storeCategory,
} from "../../models/admin/store-categories-document.js";
import type { Context } from "hono";
export const storeCateDocController = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const storeCateId = c.req.param("cateId");
      const existingImage = await storeCateDocModel.findOne({
        storeCategory_Id: storeCateId,
      });
      if (existingImage) {
        return c.json({
          msg: "Image existed please delete the old one first!",
        });
      } else {
        const file = formData.get("image") as File;
        const buffer = await file.arrayBuffer();
        const storeCate_doc = {
          storeCategory_Id: storeCateId,
          image: {
            filename: file.name,
            mimetype: file.type,
            data: Buffer.from(buffer),
            length: file.size,
          },
        };
        const validated = storeCategory.parse(storeCate_doc);
        await storeCateDocModel.create(validated);
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
  getByStoreCateId: async (c: Context) => {
    try {
      const storeCateId = c.req.param("cateId");
      const img = await storeCateDocModel
        .findOne({ storeCategory_Id: storeCateId })
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
      const storeCateId = c.req.param("cateId");
      const img = await storeCateDocModel.findOne({
        storeCategory_Id: storeCateId,
      });
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
      const storeCateId = c.req.param("cateId");
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();
      const storeCate_doc = {
        image: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
      };
      const foundImage = await storeCateDocModel.findOne({
        storeCategory_Id: storeCateId,
      });
      if (foundImage) {
        await foundImage.updateOne(storeCate_doc);
        return c.json({
          msg: "Update successfully!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
