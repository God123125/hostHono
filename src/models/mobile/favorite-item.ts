import mongoose, { Schema } from "mongoose";
import * as z from "zod";
export const FavoriteItem = z.object({
  product: z.object(),
  user: z.object(),
});
export type FavoriteItem = z.infer<typeof FavoriteItem>;
const favoriteItemSchema = new Schema<FavoriteItem>(
  {
    product: {
      type: mongoose.Types.ObjectId,
      ref: "products",
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "mobile_users",
    },
  },
  { timestamps: true },
);
export const favoriteItemModel = mongoose.model<FavoriteItem>(
  "carts",
  favoriteItemSchema,
);
