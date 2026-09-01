import { createStep, createWorkflow } from "@mastra/core/workflows";
import z from "zod";
import { inngest } from "../inngest";
import { init } from "@mastra/inngest";

// Initialize Inngest with Mastra, pointing to your local Inngest server
// const { createWorkflow, createStep } = init(inngest);

const step1 = createStep({
  id: "initial-step",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ value: z.number() }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();
    logger.info("[initial-step] Running", { inputData });
    const output = inputData;
    logger.info("[initial-step] Done", { output });
    return output;
  },
});

const highValueStep = createStep({
  id: "high-value-step",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();
    logger.info("[high-value-step] Running", { inputData });
    const output = { result: `High value: ${inputData.value}` };
    logger.info("[high-value-step] Done", { output });
    return output;
  },
});

const lowValueStep = createStep({
  id: "low-value-step",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();
    logger.info("[low-value-step] Running", { inputData });
    const output = { result: `Low value: ${inputData.value}` };
    logger.info("[low-value-step] Done", { output });
    return output;
  },
});

const finalStep = createStep({
  id: "final-step",
  inputSchema: z.object({
    "high-value-step": z.object({ result: z.string() }).optional(),
    "low-value-step": z.object({ result: z.string() }).optional(),
  }),
  outputSchema: z.object({ message: z.string() }),
  retries: 2,
  execute: async ({ inputData, mastra }) => {
    const logger = mastra.getLogger();
    logger.info("[final-step] Running", { inputData });

    const activeBranch = inputData["high-value-step"]
      ? "high-value-step"
      : "low-value-step";
    logger.info("[final-step] Active branch", { activeBranch });

    const result =
      inputData["high-value-step"]?.result ??
      inputData["low-value-step"]?.result ??
      "";

    const output = { message: result };
    logger.info("[final-step] Done", { output });
    return output;
  },
});

export const testWorkflow = createWorkflow({
  id: "branch-output-example",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ message: z.string() }),
  retryConfig: {
    attempts: 2,
    delay: 300_00,
  },
  schedule: [
    { id: "less", cron: "*/2 * * * *", inputData: { value: 1 } },
    { id: "greater", cron: "*/5 * * * *", inputData: { value: 100 } },
  ],
  // concurrency: {
  //   limit: 5,
  //   key: "event.data.userId",
  // },
  // rateLimit: {
  //   period: "1m",
  //   limit: 100,
  // },
  // throttle: {
  //   period: "10s",
  //   limit: 1,
  //   key: "event.data.organizationId",
  // },
  // priority: {
  //   run: "event.data.priority ?? 0",
  // },
  // cron: "* * * * *",
  // inputData: {
  //   value: 15,
  // },
})
  .then(step1)
  .branch([
    [async ({ inputData }) => inputData.value > 10, highValueStep],
    [async ({ inputData }) => inputData.value <= 10, lowValueStep],
  ])
  .then(finalStep)
  .commit();

// const run = await testWorkflow.createRun();

// const result = await run.start({
//   inputData: {
//     value: 10,
//   },
//   tracingOptions: {
//     metadata: { userId: "imonikhea" },
//     tags: ["production"],
//   },
// });
// import { createStep, createWorkflow } from "@mastra/core/workflows";
// import z from "zod";

// const step1 = createStep({
//   id: "initial-step",
//   inputSchema: z.object({ value: z.number() }),
//   outputSchema: z.object({ value: z.number() }),
//   execute: async ({ inputData }) => inputData,
// });

// const highValueStep = createStep({
//   id: "high-value-step",
//   inputSchema: z.object({ value: z.number() }),
//   outputSchema: z.object({ result: z.string() }),
//   execute: async ({ inputData }) => ({
//     result: `High value: ${inputData.value}`,
//   }),
// });

// const lowValueStep = createStep({
//   id: "low-value-step",
//   inputSchema: z.object({ value: z.number() }),
//   outputSchema: z.object({ result: z.string() }),
//   execute: async ({ inputData }) => ({
//     result: `Low value: ${inputData.value}`,
//   }),
// });

// const finalStep = createStep({
//   id: "final-step",
//   inputSchema: z.object({
//     "high-value-step": z.object({ result: z.string() }).optional(),
//     "low-value-step": z.object({ result: z.string() }).optional(),
//   }),
//   outputSchema: z.object({ message: z.string() }),
//   execute: async ({ inputData }) => {
//     const result =
//       inputData["high-value-step"]?.result ??
//       inputData["low-value-step"]?.result ??
//       ""; // ← guarantee a string; TypeScript now knows message: string ✓
//     return { message: result };
//   },
// });

// export const testWorkflow = createWorkflow({
//   id: "branch-output-example",
//   inputSchema: z.object({ value: z.number() }),
//   outputSchema: z.object({ message: z.string() }),
// })
//   .then(step1)
//   .branch([
//     [async ({ inputData }) => inputData.value > 10, highValueStep],
//     [async ({ inputData }) => inputData.value <= 10, lowValueStep],
//   ])
//   .then(finalStep)
//   .commit();

// // When executed with { value: 15 }
// // Only the high-value-step executes, output structure:
// // {
// //   "high-value-step": { result: "High value: 15" }
// // }

// // When executed with { value: 5 }
// // Only the low-value-step executes, output structure:
// // {
// //   "low-value-step": { result: "Low value: 5" }
// // }
