import type { ToolDisplayFn } from '@mastra/core/channels'
import { defaultTypingStatus } from '@mastra/core/channels'

/**
 * Human-friendly rendering for the copy-agent's tool activity in Slack.
 *
 * Streaming mode: emits `task_update` chunks that render as Slack's native
 * inline task timeline. Each tool call is one row, keyed by toolCallId, that
 * updates in place: in_progress -> complete/error.
 *
 * Static mode (fallback): posts a single short line when a tool finishes.
 */

const trim = (s: string, max = 90) => (s.length > max ? `${s.slice(0, max - 1)}…` : s)

function firstString(args: unknown): string | undefined {
  if (typeof args === 'string') return args
  if (args && typeof args === 'object') {
    for (const v of Object.values(args as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return undefined
}

function get(obj: unknown, key: string): unknown {
  return obj && typeof obj === 'object' ? (obj as Record<string, unknown>)[key] : undefined
}

interface TaskCopy {
  running: string
  done: string
  details?: string
  output?: string
}

function copyFor(event: {
  toolName: string
  args: unknown
  result?: unknown
}): TaskCopy | null {
  const { toolName, args, result } = event

  if (toolName === 'tavilySearch' || toolName === 'tavily-search') {
    const query = get(args, 'query') as string | undefined
    const results = get(result, 'results')
    const count = Array.isArray(results) ? results.length : undefined
    const answer = get(result, 'answer') as string | undefined
    return {
      running: query ? `🔍 Searching: ${trim(query, 50)}` : '🔍 Searching the web',
      done: count ? `🔍 Found ${count} result${count === 1 ? '' : 's'}` : '🔍 Search complete',
      details: answer ? trim(answer, 70) : undefined,
    }
  }

  if (toolName === 'tavilyExtract' || toolName === 'tavily-extract') {
    const urls = get(args, 'urls')
    const urlCount = Array.isArray(urls) ? urls.length : undefined
    const url = !urlCount && typeof urls === 'string' ? urls : undefined
    const results = get(result, 'results')
    const count = Array.isArray(results) ? results.length : undefined
    return {
      running: url ? `📄 Extracting: ${trim(url, 50)}` : '📄 Extracting content',
      done: count ? `📄 Extracted ${count} page${count === 1 ? '' : 's'}` : '📄 Extraction complete',
      details: url ? trim(url, 70) : undefined,
    }
  }

  if (toolName === 'tavilyCrawl' || toolName === 'tavily-crawl') {
    const url = get(args, 'url') as string | undefined
    const results = get(result, 'results')
    const count = Array.isArray(results) ? results.length : undefined
    return {
      running: url ? `🕷️ Crawling: ${trim(url, 50)}` : '🕷️ Crawling website',
      done: count ? `🕷️ Crawled ${count} page${count === 1 ? '' : 's'}` : '🕷️ Crawl complete',
      details: url ? trim(url, 70) : undefined,
    }
  }

  if (toolName === 'tavilyMap' || toolName === 'tavily-map') {
    const url = get(args, 'url') as string | undefined
    const results = get(result, 'results')
    const count = Array.isArray(results) ? results.length : undefined
    return {
      running: url ? `🗺️ Mapping: ${trim(url, 50)}` : '🗺️ Mapping site',
      done: count ? `🗺️ Found ${count} URL${count === 1 ? '' : 's'}` : '🗺️ Map complete',
      details: url ? trim(url, 70) : undefined,
    }
  }

  if (toolName.includes('reaction')) return null

  const pretty = event.toolName
    .replace(/^(agent-|workflow-)/, '')
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
  return { running: `⚙️ Working: ${pretty}`, done: `⚙️ Done: ${pretty}` }
}

export const slackToolDisplay: ToolDisplayFn = (event, ctx) => {
  if (event.kind === 'approval') return undefined

  const copy = copyFor(event)
  if (!copy) return undefined

  if (ctx.mode === 'streaming') {
    if (event.kind === 'running') {
      return {
        kind: 'stream',
        chunk: {
          type: 'task_update',
          id: event.toolCallId,
          title: copy.running,
          status: 'in_progress',
          details: copy.details,
        },
      }
    }
    if (event.kind === 'result') {
      return {
        kind: 'stream',
        chunk: {
          type: 'task_update',
          id: event.toolCallId,
          title: event.isError ? `${copy.running} failed` : copy.done,
          status: event.isError ? 'error' : 'complete',
          details: copy.details,
          output: copy.output,
        },
      }
    }
    return {
      kind: 'stream',
      chunk: {
        type: 'task_update',
        id: event.toolCallId,
        title: `${copy.running} failed`,
        status: 'error',
        details: trim(event.errorText, 140),
      },
    }
  }

  if (event.kind === 'result') {
    if (event.isError) {
      return { kind: 'post', message: `${copy.running} failed — ${trim(event.resultText, 140)}` }
    }
    const line = copy.output ? `${copy.done} — ${copy.output}` : copy.done
    return { kind: 'post', message: line }
  }
  if (event.kind === 'error') {
    return { kind: 'post', message: `${copy.running} failed — ${trim(event.errorText, 140)}` }
  }
  return undefined
}

export const slackTypingStatus = (
  chunk: Parameters<typeof defaultTypingStatus>[0],
  ctx: Parameters<typeof defaultTypingStatus>[1],
) => {
  if (chunk.type === 'tool-call') {
    const toolName = (chunk.payload as { toolName?: string })?.toolName ?? ''
    if (toolName === 'tavilySearch' || toolName === 'tavily-search') return 'is searching the web…'
    if (toolName === 'tavilyExtract' || toolName === 'tavily-extract') return 'is extracting content…'
    if (toolName === 'tavilyCrawl' || toolName === 'tavily-crawl') return 'is crawling a website…'
    if (toolName === 'tavilyMap' || toolName === 'tavily-map') return 'is mapping a site…'
  }
  return defaultTypingStatus(chunk, ctx)
}
