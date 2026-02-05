import type { Context } from "hono";
import { Product } from "../../models/admin/products.js";
import productModel from "../../models/admin/products.js";
import * as z from "zod";
const controller = {
  create: async (c: Context) => {
    try {
      const body = await c.req.json(); // Returns FormData object

      const price = Number(body.price);
      const discount = Number(body.discount);
      const totalPrice = price - (price * discount) / 100;
      const productData = {
        name: body.name,
        price: price,
        description: body.description,
        category: body.category,
        qty: Number(body.qty),
        isActive: body.isActive,
        discount: Number(body.discount),
        store: body.store,
        totalPrice: totalPrice,
      };

      const validated = Product.parse(productData);
      const products = new productModel(validated);
      await products.save();
      return c.json(
        {
          msg: "Product created successfully!",
        },
        201,
      );
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      } else if (e instanceof Error) {
        return c.json({ error: e.message }, 500);
      }
    }
  },
  getMany: async (c: Context) => {
    try {
      const storeId = c.req.query("store");
      const query = storeId ? { store: storeId } : {};
      const products = await productModel
        .find(query)
        .populate("category")
        .lean(); // use to read data not copy plain object from mongodb
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`; //origin yor tah url derm ot yor query te

      const productWithImage = products.map((el) => ({
        ...el,
        image_url: `${baseUrl}/api/product-document/${el._id}`,
      }));
      const total = productWithImage.length;
      return c.json({
        list: productWithImage,
        total: total,
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
      const product = await productModel.findById(id).populate("category");
      return c.json(product);
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
      const body = await c.req.json();
      const price = Number(body.price);
      const discount = Number(body.discount);
      const totalPrice = price - (price * discount) / 100;
      const productData = {
        name: body.name,
        price: price,
        description: body.description,
        category: body.category,
        qty: Number(body.qty),
        isActive: body.isActive,
        discount: Number(body.discount),
        store: body.store,
        totalPrice: totalPrice,
      };
      const updated = await productModel
        .findByIdAndUpdate(id, productData, { new: true })
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
  search: async (c: Context) => {
    try {
      const search = decodeURIComponent(c.req.query("q") as string);
      const data = await productModel.find({
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
export default controller;
