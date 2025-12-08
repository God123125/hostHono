// import type { Context } from "hono";
// import
// import * as z from "zod";
// const testService = {
//   get: async (c: Context) => {
//     try {
//       const categories = await categoryModel.find();
//       return c.json({
//         list: categories,
//       });
//     } catch (e) {
//       return c.json({
//         msg: e,
//       });
//     }
//   },
//   create: async (c: Context) => {
//     try {
//       const body = await c.req.json();
//       Category.parse(body);
//       const categories = new categoryModel(body);
//       categories.save();
//       return c.json({
//         msg: "Category created successfully!",
//       });
//     } catch (e) {
//       if (e instanceof z.ZodError) {
//         return c.json(e, 400);
//       }
//     }
//   },
//   getById: async (c: Context) => {
//     try {
//       const id = c.req.param("id");
//       const category = await categoryModel.findById(id);
//       return c.json(category);
//     } catch (e) {
//       if (e) {
//         return c.json(e, 400);
//       }
//     }
//   },
//   update: async (c: Context) => {
//     try {
//       const id = c.req.param("id");
//       const body = c.req.json();
//       Category.parse(body);
//       await categoryModel.findByIdAndUpdate(id, body);
//       return c.json({
//         msg: "Category updated successfully!",
//       });
//     } catch (e) {
//       if (e instanceof z.ZodError) {
//         return c.json(e, 400);
//       }
//     }
//   },
//   delete: async (c: Context) => {
//     try {
//       const id = c.req.param("id");
//       await categoryModel.findByIdAndDelete(id);
//       return c.json({
//         msg: "Category deleted successfully!",
//       });
//     } catch (e) {
//       return c.json(e, 500);
//     }
//   },
// };
// export default testService;
