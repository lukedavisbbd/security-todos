import { z } from "zod/v4";

export const TaskHistorySchema = z.object({
  historyId: z
    .number({ error: "historyId must be a number" })
    .int()
    .positive({ message: "historyId must be a positive integer" }),
  taskId: z
    .number({ error: "taskId must be a number" })
    .int()
    .positive({ message: "taskId must be a positive integer" }),
  statusId: z
    .number({ error: "statusId must be a number" })
    .int()
    .positive({ message: "statusId must be a positive integer" }),
  assignedToId: z
    .number({ error: "assignedToId must be a number" })
    .int()
    .positive({ message: "assignedToId must be a positive integer" })
    .nullable(),
  timestamp: z
    .date({ error: "timestamp must be a valid date" })
    .default(() => new Date()),
});

export const TaskHistoryDataSchema = TaskHistorySchema.extend({
  taskName: z
    .string(),
  statusName: z
    .string(),
});

export const CreateTaskHistorySchema = TaskHistorySchema.omit({
  historyId: true,
  timestamp: true,
});

/**
 * @typedef {Object} TaskHistory
 */
