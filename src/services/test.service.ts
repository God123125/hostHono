import type { Context } from "hono";
const testService = {
  get: async (c: Context) => {
    const body = await c.req.param("id");
    return c.json({
      msg: "hello",
    });
  },
};
export default testService;
