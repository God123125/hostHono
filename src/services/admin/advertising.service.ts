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
        store: formData.get("store") as string,
      };
      const validated = advertising.parse(body);
      await advertisingModel.create(validated);
      return c.json({
        msg: "Advertising created successfully!",
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
      const ads = await advertisingModel
        .find()
        .select("-image.data")
        .populate({
          path: "store",
          select: "name",
        })
        .lean();
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}/api/stores`;
      const baseUrlForAds = `${url.origin}${url.pathname}`;
      const adsWithStoreImage = ads.map((el: any) => ({
        ...el,
        store_img: `${baseUrl}/store-image/${el.store._id}`,
        ad_img: `${baseUrlForAds}/img/${el._id}`,
      }));
      return c.json({
        list: adsWithStoreImage,
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
      const ad = await advertisingModel.findById(id).select("-image.data");
      if (ad) {
        return c.json(ad);
      } else {
        return c.json({});
      }
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  update: async (c: Context) => {
    try {
      const id = c.req.param("id");
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
        store: formData.get("store") as string,
      };
      const updated = await advertisingModel
        .findByIdAndUpdate(id, body, {
          new: true,
        })
        .select("-image.data");
      return c.json({
        msg: "Advertising updated successfully!",
        data: updated,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        return c.json({ error: e }, 400);
      }
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await advertisingModel.findByIdAndDelete(id);
      return c.json({
        msg: "Advertising deleted successfully!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
export default controller;
