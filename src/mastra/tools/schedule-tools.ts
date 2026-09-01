import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// CREATE
export const startScheduleTool = createTool({
  id: "start_schedule",
  description: "Start a recurring schedule for the default agent.",
  inputSchema: z.object({
    schedule: z.string().describe("Cron expression for when to run."),
    prompt: z.string().describe("Prompt to run on the schedule."),
    recurring: z.boolean().describe("Whether this is a recurring schedule."),
  }),
  execute: async ({ schedule, prompt, recurring }, { mastra, agent }) => {
    if (!agent?.threadId || !agent.resourceId) {
      throw new Error(
        "A threadId and resourceId are required to create a schedule.",
      );
    }

    return mastra!.schedules.create({
      agentId: agent.agentId,
      cron: schedule,
      prompt,
      threadId: agent.threadId,
      resourceId: agent.resourceId,
      metadata: {
        recurring,
      },
    });
  },
});

// READ (single)
export const getScheduleTool = createTool({
  id: "get_schedule",
  description: "Get a schedule by ID.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule ID to retrieve."),
  }),
  execute: async ({ scheduleId }, { mastra }) =>
    mastra!.schedules.get(scheduleId),
});

// READ (list)
export const listSchedulesTool = createTool({
  id: "list_schedules",
  description: "List schedules, optionally filtered by status or agent.",
  inputSchema: z.object({
    agentId: z.string().optional().describe("Filter by agent ID."),
    status: z
      .enum(["active", "paused"])
      .optional()
      .describe("Filter by status."),
    threadId: z.string().optional().describe("Filter by thread ID."),
    resourceId: z.string().optional().describe("Filter by resource ID."),
  }),
  execute: async ({ agentId, status, threadId, resourceId }, { mastra }) =>
    mastra!.schedules.list({ agentId, status, threadId, resourceId }),
});

// UPDATE
export const updateScheduleTool = createTool({
  id: "update_schedule",
  description: "Update a schedule's cron, prompt, or other fields.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule ID to update."),
    cron: z.string().optional().describe("New cron expression."),
    prompt: z.string().optional().describe("New prompt."),
    timezone: z.string().optional().describe("New IANA timezone."),
    status: z.enum(["active", "paused"]).optional().describe("New status."),
    recurring: z
      .boolean()
      .optional()
      .describe("Whether this is a recurring schedule."),
  }),
  execute: async (
    { scheduleId, cron, prompt, timezone, status, recurring },
    { mastra },
  ) =>
    mastra!.schedules.update(scheduleId, {
      ...(cron !== undefined ? { cron } : {}),
      ...(prompt !== undefined ? { prompt } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(recurring !== undefined ? { metadata: { recurring } } : {}),
    }),
});

// PAUSE
export const stopScheduleTool = createTool({
  id: "stop_schedule",
  description: "Stop a schedule by pausing it.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule id returned by start_schedule."),
  }),
  execute: async ({ scheduleId }, { mastra }) =>
    mastra!.schedules.pause(scheduleId),
});

// RESUME
export const resumeScheduleTool = createTool({
  id: "resume_schedule",
  description: "Resume a paused schedule.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule ID to resume."),
  }),
  execute: async ({ scheduleId }, { mastra }) =>
    mastra!.schedules.resume(scheduleId),
});

// RUN (manual fire)
export const runScheduleTool = createTool({
  id: "run_schedule",
  description:
    "Fire a schedule once immediately without changing its cron cadence.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule ID to fire immediately."),
  }),
  execute: async ({ scheduleId }, { mastra }) =>
    mastra!.schedules.run(scheduleId),
});

// DELETE
export const deleteScheduleTool = createTool({
  id: "delete_schedule",
  description: "Permanently delete a schedule.",
  inputSchema: z.object({
    scheduleId: z.string().describe("Schedule ID to delete."),
  }),
  requireApproval: true,
  execute: async ({ scheduleId }, { mastra }) =>
    mastra!.schedules.delete(scheduleId),
});

// export const stopScheduleTool = createTool({
//   id: "stop_schedule",
//   description: "Stop a schedule by pausing it.",
//   inputSchema: z.object({
//     scheduleId: z.string().describe("Schedule id returned by start_schedule."),
//   }),
//   execute: async ({ scheduleId }, { mastra }) =>
//     mastra!.schedules.pause(scheduleId),
// });

// export const startScheduleTool = createTool({
//   id: "start_schedule",
//   description: "Start a recurring schedule for the default agent.",
//   inputSchema: z.object({
//     schedule: z.string().describe("Cron expression for when to run."),
//     prompt: z.string().describe("Prompt to run on the schedule."),
//   }),
//   execute: async ({ schedule, prompt }, { mastra, agent }) => {
//     if (!agent?.threadId || !agent.resourceId) {
//       throw new Error(
//         "A threadId and resourceId are required to create a schedule.",
//       );
//     }

//     return mastra!.schedules.create({
//       agentId: "agent",
//       cron: schedule,
//       prompt,
//       threadId: agent.threadId,
//       resourceId: agent.resourceId,
//     });
//   },
// });
