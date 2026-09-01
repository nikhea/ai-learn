import { z } from 'zod';

// Bump this if you ever rename/remove a field — see "Schema evolution" below.
export const USER_PROFILE_SCHEMA_VERSION = 1 as const;

const COMMUNICATION_STYLES = ['formal', 'casual', 'technical'] as const;
const KNOWN_ROLES = ['owner', 'admin', 'member', 'viewer'] as const; // mirror your CASL roles

// IANA tz name, e.g. "America/New_York" — bare regex check, not exhaustive but
// catches the model inventing a value instead of using a real zone.
const IANA_TZ_RE = /^[A-Za-z_]+\/[A-Za-z_]+(\/[A-Za-z_]+)?$/;
// ISO 639-1
const LANG_RE = /^[a-z]{2}(-[A-Z]{2})?$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const userProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .nullable()
      .optional()
      .describe("User's preferred display name."),

    timezone: z
      .string()
      .regex(IANA_TZ_RE, 'must be an IANA timezone, e.g. America/New_York')
      .nullable()
      .optional()
      .describe('IANA timezone, e.g. "America/New_York". Set null to clear.'),

    preferredLanguage: z
      .string()
      .regex(LANG_RE, 'must be an ISO 639-1 code, e.g. en or en-US')
      .nullable()
      .optional()
      .describe('ISO 639-1 language code the user prefers responses in.'),

    role: z
      .enum(KNOWN_ROLES)
      .nullable()
      .optional()
      .describe(
        'Workspace role, if the user has stated it. One of: ' +
          KNOWN_ROLES.join(', '),
      ),

    activeWorkspaceId: z
      .string()
      .regex(UUID_RE, 'must be a UUID')
      .nullable()
      .optional()
      .describe('UUID of the workspace the user is currently working in.'),

    preferences: z
      .object({
        communicationStyle: z
          .enum(COMMUNICATION_STYLES)
          .nullable()
          .optional()
          .describe('One of: ' + COMMUNICATION_STYLES.join(', ')),
        notifyByEmail: z.boolean().nullable().optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict(); // reject fields the model invents outside this shape

export type UserProfile = z.infer<typeof userProfileSchema>;

// ---- Working memory: resource-scoped, structured (Zod) ----
// const userProfileSchema = z.object({
//   name: z.string().optional(),
//   timezone: z.string().optional(),
//   preferredLanguage: z.string().optional(),
//   role: z.string().optional(),
//   activeWorkspaceId: z.string().optional(),
//   preferences: z
//     .object({
//       communicationStyle: z.string().optional(),
//       notifyByEmail: z.boolean().optional(),
//     })
//     .optional(),
// });

// const conversationFactsExtractor = new Extractor({
//   name: 'Conversation facts',
//   instructions:
//     'Extract durable, conversation-specific facts worth carrying forward: ' +
//     'the task the user is working on, decisions made, and open questions. ' +
//     'Do not extract user profile facts — those belong in working memory.',
//   schema: z.object({
//     currentTask: z.string().optional(),
//     decisions: z.array(z.string()).optional(),
//     openQuestions: z.array(z.string()).optional(),
//   }),
// });
