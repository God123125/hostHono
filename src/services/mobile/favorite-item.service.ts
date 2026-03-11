import type { Context } from "hono";
import { favoriteItemModel } from "../../models/mobile/favorite-item.js";
import * as z from "zod";
export const favoriteItemController = {
  create: async (c: Context) => {
    try {
      const req = await c.req.json();
      const user = c.get("user");
      const productId = req.product;
      const body = {
        user: user,
        product: productId,
      };
      await favoriteItemModel.create(body);
      return c.json({
        msg: "Item added to favorite list!",
      });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  getMany: async (c: Context) => {
    try {
      const user = c.get("user");
      const data = await favoriteItemModel.find({ user: user }).populate([
        {
          path: "product",
          select: "-image",
        },
      ]);
      const url = new URL(c.req.url);
      const baseUrl = `${url.origin}`;
      const formattedData = data.map((el) => {
        return {
          ...el,
          img_url: `${baseUrl}/api/products/img/${el._id}`,
        };
      });
      return c.json({ list: formattedData });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
  delete: async (c: Context) => {
    try {
      const id = c.req.param("id");
      await favoriteItemModel.findByIdAndDelete(id);
      return c.json({ msg: "Item removed successfully!" });
    } catch (e) {
      return c.json({ error: e }, 500);
    }
  },
};
