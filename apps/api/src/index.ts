import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ status: "ok" }));

export default app;
