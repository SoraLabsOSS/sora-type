import { D1UpdateEndpoint } from "chanfana";
import type { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskUpdate extends D1UpdateEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
    fields: TaskModel.schema.pick({
      name: true,
      slug: true,
      description: true,
      completed: true,
      due_date: true,
    }),
  };
}
