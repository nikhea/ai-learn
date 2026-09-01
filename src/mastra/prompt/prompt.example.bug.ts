import type { Mastra } from "@mastra/core/mastra";
import { activatePromptBlockVersion, updatePromptBlock } from "../api/prompts";
import { mastraClient } from "../api/base";

export async function renderPrompt(mastra: Mastra) {
  const storaged = mastra.getStorage();
  if (storaged) {
  }

  const prompt = await storaged?.getStore("promptBlocks");

  const editor = mastra.getEditor()!;
  const promptId = "testPrompt";

  // const createPrompt = await editor.prompt.create({
  //   id: promptId,
  //   name: "new Prompt",
  //   authorId: "user-123",
  //   description: "new Prompt Inc. tone and brand guidelines",
  //   content: "You write new Prompt in a friendly, concise tone.",
  //   metadata: {
  //     team: "branding",
  //     environment: "staging",
  //   },
  //   requestContextSchema: {
  //     type: "object",
  //     properties: {
  //       userName: { type: "string" },
  //     },
  //     required: ["userName"],
  //   },
  //   rules: {
  //     operator: "AND",
  //     conditions: [
  //       {
  //         field: "userName",
  //         operator: "exists",
  //       },
  //     ],
  //   },
  // });

  const p = await editor.prompt.preview(
    [
      { type: "prompt_block_ref", id: promptId },
      { type: "text", content: "{{numberOfUsers}}" },
      { type: "text", content: "{{numberOfUsers}}" },
      { type: "text", content: "{{numberOfUsers}}" },
      { type: "text", content: "{{numberOfUsers}}" },
    ],
    {
      userName: "peter",
      brand_Name: "iphone",
      brandcolor: "white",
      numberOfUsers: 12,
    },
  );

  // console.log({ ...createPrompt });
  console.log({ p: p.trim() });

  // const getPrompt = await editor.prompt.getById(promptId);
  // console.log(getPrompt);

  // setTimeout(async () => {
  //   const updatePrompt = await updatePromptBlock(getPrompt?.id!, {
  //     name: "update Prompt",
  //     status: "published",
  //     authorId: "user-123",
  //     description: "updated Prompt Inc. tone and brand guidelines",
  //     content: `You writes new/updatedxc Prompt in a friendly, concise tone. {{userName}} and brand color {{brandcolor}} with brand name {{brand_Name}}`,
  //     metadata: {
  //       team: "branding",
  //       number: 12,
  //       age: 14,
  //       xc: false,
  //       environment: "staging",
  //     },
  //     requestContextSchema: {
  //       type: "object",
  //       properties: {
  //         userName: { type: "string" },
  //         brandcolor: { type: "string" },
  //         brand_Name: { type: "string" },
  //       },
  //       required: ["userName", "brand_Name", "numberOfUsers"],
  //     },
  //     rules: {
  //       operator: "OR",
  //       conditions: [
  //         {
  //           field: "userName",
  //           operator: "exists",
  //         },
  //         {
  //           field: "brand_Name",
  //           operator: "not_equals",
  //           value: "default",
  //         },
  //       ],
  //     },
  //   });

  //   const activated = await editor.prompt.update({
  //     id: getPrompt?.id!,
  //     status: "published",
  //   });

  //   const getPromptc = await editor.prompt.getById(promptId);
  //   console.log(getPromptc);

  //   console.log({ updatePrompt, activated });
  // }, 5000);

  // wait 5s for server to be ready

  // console.log({ updatePrompt });

  // const deletePrompt = await editor.prompt.delete(promptId);

  // console.log({ deletePrompt });
}

// OUTPUT CREATE PROMPT

// {
//   id: 'testPrompt',
//   status: 'draft',
//   activeVersionId: undefined,
//   authorId: 'user-123',
//   metadata: { team: 'branding', environment: 'staging' },
//   createdAt: 2026-05-26T16:17:40.977Z,
//   updatedAt: 2026-05-26T16:17:40.977Z,
//   name: 'new Prompt',
//   description: 'new Prompt Inc. tone and brand guidelines',
//   content: 'You write new Prompt in a friendly, concise tone.',
//   rules: { operator: 'AND', conditions: [ [Object] ] },
//   requestContextSchema: {
//     type: 'object',
//     properties: { userName: [Object] },
//     required: [ 'userName' ]
//   },
//   resolvedVersionId: '0112a83e-e71f-4966-8bc0-0a97b4ed8ce2'
// }

// OUTPUT UPDATE PROMPT

// {
//   id: 'testPrompt',
//   status: 'archived',
//   activeVersionId: undefined,
//   authorId: 'user-123',
//   metadata: { team: 'branding', environment: 'staging', number: 12, age: 14 },
//   createdAt: 2026-05-26T16:17:40.977Z,
//   updatedAt: 2026-05-26T16:17:40.982Z,
//   name: 'new Prompt',
//   description: 'new Prompt Inc. tone and brand guidelines',
//   content: 'You write new Prompt in a friendly, concise tone.',
//   rules: { operator: 'AND', conditions: [ [Object] ] },
//   requestContextSchema: {
//     type: 'object',
//     properties: { userName: [Object] },
//     required: [ 'userName' ]
//   },
//   resolvedVersionId: '0112a83e-e71f-4966-8bc0-0a97b4ed8ce2'
// }
