import { registerApiRoute } from "@mastra/core/server";
import { durableLongformAgent } from "../agents/longformWriter-agent";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { handleChatStream, toAISdkStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse, type UIMessage } from "ai";

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-store",
  "x-accel-buffering": "no",
};

export const titleSseRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/title",
  {
    method: "GET",
    handler: async (c) => {
      const { chatId } = c.req.param();
      const mastra = c.get("mastra");

      // Subscribe to the title topic and stream it to the client
      return new Response(
        new ReadableStream({
          start(controller) {
            const unsubscribe = mastra.pubsub.subscribe(
              `thread.title.${chatId}`,
              (event) => {
                controller.enqueue(`data: ${JSON.stringify(event.data)}\n\n`);
              },
            );
            // stash unsubscribe for cancel()
            (controller as any)._unsubscribe = unsubscribe;
          },
          cancel(controller) {
            (controller as any)._unsubscribe?.();
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
          },
        },
      );
    },
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLatestUserText(messages: UIMessage[]): string {
  const lastMessage = [...messages].reverse().find((m) => m.role === "user");

  if (!lastMessage) return "";

  return (
    lastMessage.parts
      ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n") ?? ""
  );
}

function throttleStream(
  readable: ReadableStream,
  delayMs = 50, // ms between each chunk
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const reader = readable.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          await new Promise((r) => setTimeout(r, delayMs));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      // client disconnected, durable run keeps going
    },
  });
}

// ─── POST /custom/resumable-chat/:chatId/chat ─────────────────────────────────
// Starts a new durable run and immediately returns the AI SDK UI message stream.
// chatId is used as the runId so the GET /stream route can observe() by the same key.

export const resumableChatPostRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/chat",
  {
    method: "POST",
    cors: {
      origin: ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "x-run-id", "Accept"],
      exposeHeaders: ["x-run-id"],
    },
    handler: async (c) => {
      const { chatId } = c.req.param();
      const body = await c.req.json();
      const mastra = c.get("mastra");

      const messages: UIMessage[] = Array.isArray(body.messages)
        ? body.messages
        : [];

      const prompt = getLatestUserText(messages);

      if (!prompt.trim()) {
        return c.json({ error: "prompt is required" }, 400);
      }

      const runId = crypto.randomUUID();

      const { output, cleanup } = await durableLongformAgent.stream(prompt, {
        // Use chatId as runId so observe(chatId) can find this run
        runId,
        memory: {
          thread: chatId,
          resource: chatId,
          onTitleGenerated(title) {
            console.log(title);
            mastra.pubsub.publish(`thread.title.${chatId}`, {
              type: "thread-title",
              runId,
              data: { title },
            });
          },
        },
        onFinish: () => cleanup(),
        onError: () => cleanup(),
      });

      // toAISdkStream expects the MastraModelOutput object, not output.fullStream.
      // The `as any` cast resolves the FinishReason union mismatch between the
      // internal AI SDK version used by @mastra/ai-sdk and the `ai` package version.
      const aiSdkStream = toAISdkStream(output, { from: "agent" });
      console.log({ runId });

      return createUIMessageStreamResponse({
        // stream: throttleStream(aiSdkStream as any, 50) as any,
        stream: aiSdkStream as any,
        headers: {
          "x-run-id": runId,
          "access-control-expose-headers": "x-run-id",
        },
      });
    },
  },
);

// ─── GET /custom/resumable-chat/:chatId/stream ────────────────────────────────
// useChat calls this on mount (resume: true) to reconnect to an in-progress run.
// Returns 204 when no active run exists — that is what useChat expects.
// Returns the AI SDK UI message stream when a run is found.

export const resumableChatStreamRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/stream",
  {
    method: "GET",
    handler: async (c) => {
      // const { chatId } = c.req.param();

      // ✅ Read runId from query param, NOT from chatId.
      const runId = c.req.query("runId");
      const offset = c.req.query("offset") || "0";

      const parsedOffset = parseInt(offset);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return c.json({ error: "Invalid offset" }, 400);
      }

      console.log({ runId, offset: parsedOffset });

      if (!runId) {
        // No runId means no active stream to resume.
        return new Response(null, { status: 204 });
      }

      let observeResult: Awaited<
        ReturnType<typeof durableLongformAgent.observe>
      >;

      try {
        observeResult = await durableLongformAgent.observe(runId, {
          offset: parsedOffset,
        });
      } catch {
        // No active run for this runId — tell useChat there is nothing to resume.
        // Must be 204, not 404; useChat treats anything else as an error.
        return new Response(null, { status: 204 });
      }

      const { output, cleanup } = observeResult;

      // Same conversion as the POST route.
      // Client disconnects (cancel) do NOT call cleanup() — the durable run
      // keeps progressing so the client can reconnect with the same chatId.
      const aiSdkStream = toAISdkStream(output, { from: "agent" });

      return createUIMessageStreamResponse({
        // stream: throttleStream(aiSdkStream as any, 50) as any,
        stream: aiSdkStream as any,
        headers: {
          "x-run-id": runId,
          "access-control-expose-headers": "x-run-id",
        },
      });
    },
  },
);

// ─── GET /custom/resumable-chat/:chatId/messages ─────────────────────────────
// Loads persisted messages from Mastra memory for the given chatId.
// The frontend calls this on mount to hydrate the message list before
// connecting to the stream.

export const resumableChatMessagesRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/messages",
  {
    method: "GET",
    handler: async (c) => {
      try {
        const { chatId } = c.req.param();

        const memory = await durableLongformAgent.getMemory();

        if (!memory) {
          return c.json({ messages: [] });
        }

        const thread = await memory.getThreadById({ threadId: chatId });

        if (!thread) {
          return c.json({ messages: [] });
        }

        const recalled = await memory.recall({
          threadId: chatId,
          resourceId: chatId,
          orderBy: {
            field: "createdAt",
            direction: "ASC",
          },
          perPage: 200,
          page: 0,
        });

        return c.json({
          messages: toAISdkV5Messages(recalled.messages),
        });
      } catch (error) {
        console.error("Failed to load resumable chat messages", error);
        return c.json({ messages: [] });
      }
    },
  },
);

// ─── POST /custom/resumable-chat/:chatId/stop ─────────────────────────────────
// Explicitly stops a durable run. Since durable agents ignore client disconnects
// by design, this endpoint allows the frontend to explicitly terminate a run.

export const resumableChatStopRoute = registerApiRoute(
  "/custom/resumable-chat/:chatId/stop",
  {
    method: "POST",
    cors: {
      origin: ["http://localhost:3000"],
      allowHeaders: ["Content-Type", "Authorization", "Accept"],
    },
    handler: async (c) => {
      // You can extract the runId from the JSON body
      const body = await c.req.json().catch(() => ({}));
      const runId = body.runId;

      if (!runId) {
        return c.json({ error: "runId is required to stop the stream" }, 400);
      }

      try {
        // Observe the run to grab its specific cleanup function
        const { cleanup } = await durableLongformAgent.observe(runId);

        // Calling cleanup() destroys the run's cached events and registry entries,
        // preventing further streaming or resumption.
        cleanup();

        return c.json({ success: true, message: "Stream stopped." });
      } catch (error) {
        // If observe throws, the run likely doesn't exist or is already cleaned up
        console.error("Failed to stop stream or run not found:", error);
        return c.json({ error: "Run not found or already stopped." }, 404);
      }
    },
  },
);
