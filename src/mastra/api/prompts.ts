import type {
  UpdateStoredPromptBlockParams,
  StoredPromptBlockResponse,
  ListStoredPromptBlocksParams,
  ListStoredPromptBlocksResponse,
  DeleteStoredPromptBlockResponse,
  ActivatePromptBlockVersionResponse,
} from "@mastra/client-js";

import axios from "axios";

const BASE_URL = process.env.BACKEND_SERVER_URL;
const API_PREFIX = "/api";

const client = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
});

export type UpdatePromptBlockParams = UpdateStoredPromptBlockParams & {
  status?: "draft" | "published" | "archived";
};
export type PromptBlockResponse = StoredPromptBlockResponse;

export async function updatePromptBlock(
  id: string,
  params: UpdatePromptBlockParams,
) {
  const { data } = await client.patch<PromptBlockResponse>(
    `/stored/prompt-blocks/${encodeURIComponent(id)}`,
    params,
  );
  return data;
}

export async function getPromptBlock(id: string) {
  const { data } = await client.get<PromptBlockResponse>(
    `/stored/prompt-blocks/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function listPromptBlocks(params?: ListStoredPromptBlocksParams) {
  const { data } = await client.get<ListStoredPromptBlocksResponse>(
    "/stored/prompt-blocks",
    { params },
  );
  return data;
}

export async function deletePromptBlock(id: string) {
  const { data } = await client.delete<DeleteStoredPromptBlockResponse>(
    `/stored/prompt-blocks/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function activatePromptBlockVersion(
  promptBlockId: string,
  versionId: string,
) {
  const { data } = await client.post<ActivatePromptBlockVersionResponse>(
    `/stored/prompt-blocks/${encodeURIComponent(promptBlockId)}/versions/${encodeURIComponent(versionId)}/activate`,
  );
  return data;
}
