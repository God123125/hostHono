import type { Context } from "hono";
import { storeCategoryModel } from "../../models/admin/store_categories.js";
import { storeCategory } from "../../models/admin/store_categories.js";
import path from "path";
import { readFile } from "fs/promises";
import * as z from "zod";
export const storeCategoryController = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const body: any = {
        name: formData.get("name") as string,
        des: formData.get("des") as string,
      };
      if (file && file.size > 0) {
        // User uploaded a profile image
        const buffer = await file.arrayBuffer();
        body.image = {
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
          "default_store_category.jpg",
        );
        try {
          const defaultBuffer = await readFile(defaultImagePath);
          body.image = {
            filename: "default_store_category.jpg",
            mimetype: "image/jpg",
            data: defaultBuffer,
            length: defaultBuffer.length,
          };
        } catch (error) {
          console.log("Default image not found at:", defaultImagePath);
        }
      }
      const created = await storeCategoryModel.create(body);
      return c.json({
        msg: "Store category created successfully!",
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
      const categories = await storeCategoryModel
        .find()
        .select("-image.data")
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedCategories = categories.map((el) => ({
        ...el,
        image_url: `${baseUrl}/api/store-categories/img/${el._id}`,
      }));
      return c.json({
        list: formattedCategories,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const category = await storeCategoryModel.findById(id).lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedStoreCate = {
        ...category,
        image_url: `${baseUrl}/api/store-categories/${category?._id}`,
      };
      return c.json(formattedStoreCate);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await storeCategoryModel.findById(id).select("image");
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
  updateInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      await storeCategoryModel.findByIdAndUpdate(id, body, { new: true });
      return c.json({
        msg: "Store category updated successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  updateImg: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData();
      const file = formData.get("image") as File;
      const body: any = {};

      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        body.image = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }
      if (!body.image) {
        return c.json({ msg: "Please input file" }, 400);
      }
      await storeCategoryModel.findByIdAndUpdate(id, body);
      return c.json({
        msg: "Store category updated successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await storeCategoryModel.findByIdAndDelete(id);
      return c.json({
        msg: "Store category deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await storeCategoryModel.find({
        name: { $regex: search, $options: "i" },
      });
      if (data.length > 0) {
        return c.json({
          list: data,
        });
      } else {
        return c.json({
          msg: "No data found!",
        });
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
