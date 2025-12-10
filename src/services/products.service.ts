import type { Context } from "hono";
import { Product } from "../models/products.js";
import productModel from "../models/products.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData(); // Returns FormData object

      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();

      const productData = {
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        qty: Number(formData.get("qty")),
        image: {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        },
        status: formData.get("status") === "true",
      };

      const validated = Product.parse(productData);
      const products = new productModel(validated);
      await products.save();
      return c.json(
        {
          msg: "Product created successfully!",
          product: products,
        },
        201
      );
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server error" }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const products = await productModel
        .find()
        .select("-image.data")
        .populate("category");
      return c.json({
        list: products,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server Error" }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const product = await productModel
        .findById(id)
        .select("-image.data")
        .populate("category");
      return c.json(product);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server Error" }, 500);
    }
  },
  getImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await productModel.findById(id).select("image");
      return c.body(img!.image.data, 200, {
        "Content-Type": img!.image.mimetype,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server Error" }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData(); // Returns FormData object

      const updateData: any = {
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        qty: Number(formData.get("qty")),
        status: formData.get("status") === "true",
      };

      // Only update image if a new one is provided
      const file = formData.get("image") as File | null;
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        updateData.image = {
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      }

      const validated = Product.parse(updateData);
      const updated = await productModel
        .findByIdAndUpdate(id, validated)
        .select("-image.data")
        .populate("category");
      return c.json({
        msg: "Product updated successfully!",
        data: updated,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json(`Internal server error ${e}`, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await productModel.findByIdAndDelete(id);
      return c.json({
        msg: "Product deleted successfully!",
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server Error" }, 500);
    }
  },
};
export default controller;
