import axios from "axios";

const BASE_URL = process.env.BACKEND_SERVER_URL;
const API_PREFIX = "/api";

const client = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: { "Content-Type": "application/json" },
});

export interface UpdateMemoryThreadParams {
  title?: string;
  metadata?: Record<string, unknown>;
  resourceId?: string;
}

export interface MemoryThreadResponse {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export async function updateMemoryThread(
  threadId: string,
  params: UpdateMemoryThreadParams,
  agentId: string,
) {
  const { data } = await client.patch<MemoryThreadResponse>(
    `/memory/threads/${encodeURIComponent(threadId)}`,
    params,
    { params: { agentId } },
  );
  return data;
}
