const testService = {
    get: async (c) => {
        const body = await c.req.param("id");
        return c.json({
            msg: "hello",
        });
    },
};
export default testService;
