import type { Context } from "hono";
import { Product } from "../../models/admin/products.js";
import productModel from "../../models/admin/products.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData(); // Returns FormData object

      const file = formData.get("image") as File;
      const buffer = await file.arrayBuffer();
      const price = Number(formData.get("price"));
      const discount = Number(formData.get("discount"));
      const totalPrice = price - (price * discount) / 100;
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
        isActive: formData.get("status") === "true",
        discount: Number(formData.get("discount")),
        store: formData.get("store") as string,
        totalPrice: totalPrice,
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
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const products = await productModel
        .find()
        .select("-image.data")
        .populate("category")
        .lean(); // use to read data not copy plain object from mongodb
      const productWithImage = products.map((el) => ({
        ...el,
        image_url: `${c.req.url}/img/${el._id}`,
      }));
      return c.json({
        list: productWithImage,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
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
      if (img) {
        return c.body(img!.image.data, 200, {
          "Content-Type": img!.image.mimetype,
        });
      } else {
        return c.json({
          msg: "Image not found",
        });
      }
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const formData = await c.req.formData(); // Returns FormData object
      const price = Number(formData.get("price"));
      const discount = Number(formData.get("discount"));
      const totalPrice = price - (price * discount) / 100;
      const updateData: any = {
        name: formData.get("name") as string,
        price: Number(formData.get("price")),
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        qty: Number(formData.get("qty")),
        isActive: formData.get("status") === "true",
        discount: Number(formData.get("discount")),
        totalPrice: totalPrice,
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
      return c.json({ error: e }, 500);
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
      return c.json({ error: e }, 500);
    }
  },
};
export default controller;
