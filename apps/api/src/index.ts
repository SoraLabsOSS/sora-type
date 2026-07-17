import { Hono } from "hono";
import { sessionsRouter } from "./routes/sessions";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ status: "ok" }));

app.route("/sessions", sessionsRouter);

export default app;
