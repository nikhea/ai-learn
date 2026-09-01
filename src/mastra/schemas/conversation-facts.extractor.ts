import { Extractor } from '@mastra/memory';
import { z } from 'zod';
import type { IMastraLogger } from '@mastra/core/logger';
const conversationFactsSchema = z
  .object({
    currentTask: z
      .string()
      .trim()
      .max(300)
      .nullable()
      .optional()
      .describe(
        'The single task the user is actively working on right now, or null if none.',
      ),
    decisions: z
      .array(z.string().trim().min(1).max(300))
      .max(10)
      .optional()
      .describe(
        'Concrete decisions made in this conversation. Most recent last.',
      ),
    openQuestions: z
      .array(z.string().trim().min(1).max(300))
      .max(10)
      .optional()
      .describe(
        'Unresolved questions blocking progress. Remove once answered.',
      ),
  })
  .strict();

export type ConversationFacts = z.infer<typeof conversationFactsSchema>;

// Strip control characters and collapse whitespace defensively — belt-and-braces
// on top of schema validation, since this text re-enters the system prompt.
function sanitize(value: string): string {
  return value
    .replace(/\p{Cc}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createConversationFactsExtractor(logger: IMastraLogger) {
  return new Extractor({
    name: 'Conversation facts',
    instructions:
      'Extract durable, conversation-specific facts worth carrying forward: ' +
      'the task the user is working on, decisions made, and open questions. ' +
      'Do not extract user profile facts (name, role, timezone, preferences) — ' +
      'those belong in working memory, not here. ' +
      'Keep each item short (one sentence). Remove decisions/questions that are no longer relevant ' +
      'rather than letting the lists grow indefinitely.',
    schema: conversationFactsSchema,
    includePreviousExtraction: true,

    onExtracted({ current, previous, threadId, resourceId }) {
      const parsed = conversationFactsSchema.safeParse(current);
      if (!parsed.success) {
        logger.warn(
          'conversation-facts extraction failed validation, keeping previous value',

          { threadId, resourceId, issues: parsed.error.issues },
        );
        return previous; // don't let a malformed extraction clobber a good one
      }

      const clean: ConversationFacts = {
        currentTask: parsed.data.currentTask
          ? sanitize(parsed.data.currentTask)
          : parsed.data.currentTask,
        decisions: parsed.data.decisions?.map(sanitize).slice(0, 10),
        openQuestions: parsed.data.openQuestions?.map(sanitize).slice(0, 10),
      };

      logger.debug('conversation facts extracted', {
        threadId,
        resourceId,
        clean,
      });
      return clean;
    },
  });
}
