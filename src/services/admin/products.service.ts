import type { Context } from "hono";
import { Product } from "../../models/admin/products.js";
import productModel from "../../models/admin/products.js";
import * as z from "zod";
import path from "path";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
dotenv.config();
const controller = {
  create: async (c: Context) => {
    try {
      const formData = await c.req.formData(); // Returns FormData object
      const file = formData.get("image") as File;
      const price = Number(formData.get("price"));
      const discount = Number(formData.get("discount"));
      const price_after_discount = price - (price * discount) / 100;
      const productData: any = {
        name: formData.get("name") as string,
        price: price,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        isActive: true,
        discount: Number(formData.get("discount")),
        store: formData.get("store") as string,
        price_after_discount: price_after_discount,
        createdBy: c.get("user"),
      };
      if (file && file.size > 0) {
        const buffer = await file.arrayBuffer();
        productData.image = {
          // ✅ image
          filename: file.name,
          mimetype: file.type,
          data: Buffer.from(buffer),
          length: file.size,
        };
      } else {
        const imageUrl = `${process.env.APP_URL}/images/default-product.png`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.log("Failed to fetch default image:", response.status);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        productData.image = {
          filename: "default-product.png",
          mimetype: "image/png",
          data: buffer,
          length: buffer.length,
        };
      }
      const validated = Product.parse(productData);
      await productModel.create(validated);
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
      const { limit, category } = c.req.query();
      const query: any = {};
      const user = await c.get("user");
      query.createdBy = user;
      query.store = c.get("store").toString();
      if (category) query.category = category.toString();
      const products = await productModel
        .find(query)
        .select("-image")
        .populate("category")
        .limit(Number(limit))
        .lean(); // use to read data not copy plain object from mongodb
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`; //origin yor tah url derm ot yor query te
      const productWithImage = products.map((el) => ({
        ...el,
        image_url: `${baseUrl}/api/products/img/${el._id}`,
      }));
      const total = productWithImage.length;
      return c.json({
        list: productWithImage,
        total: total,
      });
    } catch (e) {
      console.log(e);
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  getImage: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const img = await productModel.findById(id).select("image");

      if (img && img.image && img.image.data) {
        // ✅ Convert Buffer/Binary from MongoDB to proper binary
        const imageBuffer = Buffer.isBuffer(img.image.data)
          ? img.image.data
          : Buffer.from(img.image.data.buffer); // MongoDB stores as Binary

        return c.body(imageBuffer, 200, {
          "Content-Type": img.image.mimetype,
        });
      }

      return c.json({ msg: "Image not found" }, 404);
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getById: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const product = await productModel
        .findById(id)
        .select("-image")
        .populate("category")
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedData = {
        ...product,
        image_url: `${baseUrl}/api/products/img/${product?._id}`,
      };
      return c.json(formattedData);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: "Server Error" }, 500);
    }
  },
  updateInfo: async (c: Context) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json();
      const price = Number(body.price);
      const discount = Number(body.discount);
      const price_after_discount = price - (price * discount) / 100;
      const productData = {
        name: body.name,
        price: price,
        description: body.description,
        category: body.category,
        isActive: body.isActive,
        discount: Number(body.discount),
        store: body.store,
        price_after_discount: price_after_discount,
        createdBy: c.get("user"),
      };
      const updated = await productModel
        .findByIdAndUpdate(id, productData, { new: true })
        .populate("category")
        .select("-image");
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
  updateImage: async (c: Context) => {
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
      await productModel.findByIdAndUpdate(id, body);
      return c.json({ msg: "Product Image updated successfully!" });
    } catch (e) {
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
      const search = c.req.query("q") || "";
      const storeId = c.get("store");
      const category_id = c.req.query("category") || "";
      const query: any = {
        name: { $regex: search.trim().toString(), $options: "i" },
        store: storeId.toString(),
        category: category_id.toString(),
      };
      const data = await productModel.find(query).populate("category").lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedData = data.map((el) => {
        return {
          ...el,
          image_url: `${baseUrl}/api/products/img/${el._id}`,
        };
      });
      return c.json({
        list: formattedData,
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getProductsGroupedByCategory: async (c: Context) => {
    try {
      const { limit } = c.req.query();
      const storeId = c.get("store");
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const productLimit = limit ? Number(limit) : 4;
      const pipeline: any[] = [
        // Filter by store if provided
        ...(storeId
          ? [
              {
                $match: {
                  store: storeId,
                },
              },
            ]
          : []),

        // Lookup category details
        {
          $addFields: {
            categoryObjectId: { $toObjectId: "$category" },
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "categoryObjectId",
            foreignField: "_id",
            as: "categoryData",
          },
        },

        // Unwind category
        {
          $unwind: {
            path: "$categoryData",
            preserveNullAndEmptyArrays: false,
          },
        },

        // Group by category
        {
          $group: {
            _id: "$category",
            name: { $first: "$categoryData.name" },
            description: { $first: "$categoryData.desc" },
            products: {
              $push: {
                _id: "$_id",
                name: "$name",
                price: "$price",
                description: "$description",
                qty: "$qty",
                isActive: "$isActive",
                discount: "$discount",
                totalPrice: "$totalPrice",
                store: "$store",
                createdAt: "$createdAt",
                updatedAt: "$updatedAt",
                image_url: {
                  $concat: [
                    `${baseUrl}/api/products/img/`,
                    { $toString: "$_id" },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            products: { $slice: ["$products", productLimit] },
          },
        },
        {
          $sort: { name: 1 },
        },
      ];

      const list = await productModel.aggregate(pipeline);

      return c.json({
        list: list,
        total: list.length,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json(e, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  //Function for mobile app
  getManyForMobile: async (c: Context) => {
    try {
      const { limit, category, store } = c.req.query();
      const query: any = {};
      if (category) query.category = category.toString();
      if (store) query.store = store.toString();
      const products = await productModel
        .find(query)
        .select("-image")
        .populate("category")
        .limit(Number(limit))
        .lean(); // use to read data not copy plain object from mongodb
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`; //origin yor tah url derm ot yor query te
      const productWithImage = products.map((el) => ({
        ...el,
        image_url: `${baseUrl}/api/products/img/${el._id}`,
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
};
export default controller;
