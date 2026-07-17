import { D1DeleteEndpoint } from "chanfana";
import type { HandleArgs } from "../../types";
import { TaskModel } from "./base";

export class TaskDelete extends D1DeleteEndpoint<HandleArgs> {
  _meta = {
    model: TaskModel,
  };
}
