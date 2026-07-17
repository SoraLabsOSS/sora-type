import { fromHono } from "chanfana";
import { Hono } from "hono";
import { TaskCreate } from "./task-create";
import { TaskDelete } from "./task-delete";
import { TaskList } from "./task-list";
import { TaskRead } from "./task-read";
import { TaskUpdate } from "./task-update";

export const tasksRouter = fromHono(new Hono());

tasksRouter.get("/", TaskList);
tasksRouter.post("/", TaskCreate);
tasksRouter.get("/:id", TaskRead);
tasksRouter.put("/:id", TaskUpdate);
tasksRouter.delete("/:id", TaskDelete);
