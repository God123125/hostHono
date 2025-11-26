import type { Context } from "hono";
const testService = {
  get: async (c: Context) => {
    return c.json({
      msg: "hello",
    });
  },
};
export default testService;
