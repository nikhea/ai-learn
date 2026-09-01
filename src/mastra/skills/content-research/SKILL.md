---
name: content-research
version: 1.0.0
author: Grace Leung
description: "Research trending topics, audience questions, and keyword opportunities for any niche, then turn them into a prioritized content research report. Use this skill whenever a marketer wants to find what to write about, discover trending topics, research an audience, mine the questions people are asking, find keyword or content opportunities, or validate a content angle before creating anything. Trigger for 'research topics for [niche]', 'what's trending in [industry]', 'what should we write about', 'find content opportunities', 'what questions are people asking about [topic]', 'keyword research for [topic]', or any request to gather demand-and-interest signal before content or campaign work. Works with whatever research tools are connected (Ahrefs, Perplexity, web search) and degrades gracefully when none are. Brand-agnostic: reads project context if present, otherwise asks for the niche."
---

# Content Research

Find what an audience is searching for, asking about, and talking about right now, then hand back a prioritized research report a marketer can act on. This skill gathers demand and interest signal (trends, questions, keywords, competitor angles) and ranks it by opportunity. It does not write the content; it tells you what is worth writing.

## What this skill produces

A single research report (Markdown, or a doc if asked) covering: trending topics and timely hooks, the questions the audience actually asks, keyword/topic opportunities ranked by a simple opportunity score, competitor and SERP context where available, and a short strategic summary that names the top priorities to pursue.

## Tool-agnostic by design

This skill never assumes a specific paid tool. It uses whatever is connected and says plainly what it used.

Pick the best available source in this order, and stop when you have enough signal:

1. **Dedicated SEO/keyword tools** if connected (Ahrefs, SEMrush, or similar): richest data (volume, difficulty, traffic potential, SERP).
2. **AI research/search tools** if connected (Perplexity, other research MCPs): strong for trends, audience questions, and current angles.
3. **Plain web search** (always available): trend confirmation, "people also ask" style questions, competitor scan, recency.

**Degrade gracefully.** If a richer tool is not connected, do not block and do not pretend you have data you do not. Use the next source down and state the limitation in the report (for example, "No keyword tool connected, so volume and difficulty are directional estimates from search and SERP signals, not measured metrics").

## Before you start

### Scan for brand context first (always)

Before doing any research, scan the project for a context location (a folder or files holding brand, audience, voice, or strategy material; names vary, identify by contents, not a fixed path). This is a required first step, not optional. If present, read it for: the niche, the target audience and their language, the offer, and any positioning, and bake it into the research so every opportunity is judged against this brand and audience rather than a generic market.

If no context exists, confirm three things before researching: the **seed topic / niche**, the **target country/market** (default US), and the **audience** (who the content is for). Ask in one message, not one at a time.

## Workflow

### Step 1: Trend pass (always run)

Find what is current, not just evergreen. For the niche and its subtopics, look for: new angles and emerging subtopics, recent questions the audience is asking, seasonal or timely moments, and anything spiking in interest. Use the best connected research/search tool. Capture 5 to 10 timely hooks with a one-line note on why each is live right now.

### Step 2: Question mining

Collect the real questions people ask about the topic, in their own words. Sources, best first: a keyword tool's question report; "people also ask" and autocomplete from search; AI research tool output; forum/community phrasing (Reddit, Quora) via search. Keep verbatim phrasing where possible, because that language is what makes content rank and resonate. Aim for 10 to 20 questions.

### Step 3: Keyword / topic opportunities

Build a list of topic opportunities. If a keyword tool is connected, pull volume, difficulty, and traffic potential. If not, group the questions and trends into topic clusters and estimate interest qualitatively (high/medium/low) from search prevalence, flagging that these are directional.

**Quick-win criteria** (when metrics are available): volume 500+, difficulty low (KD < 30 to 40), healthy traffic potential.

**Opportunity score** (when metrics are available), to rank the list:

```
Opportunity Score = (Volume x Traffic Potential) / (Difficulty + 1)
```

Higher is better. When metrics are not available, rank by a blend of audience-fit, trend freshness, and apparent search prevalence, and label the ranking as qualitative.

**Tag intent** on each item: informational (how to, what is, guide), commercial (best, top, review, vs), or transactional (buy, price, cost, deal). Intent tells the marketer what kind of content each topic needs.

### Step 4: Competitor / SERP context (when available)

For the 2 to 3 most promising topics, check what already ranks or who already owns the angle: top results and their authority, the dominant content type (listicle, guide, tool, video), visible SERP features (featured snippet, PAA), and gaps no one is filling well. This separates "high demand" from "high demand you can actually win."

### Step 5: Synthesize

Turn raw signal into a prioritized report. Lead with the opportunities that combine real demand, audience fit, and a winnable angle. Be honest about confidence given the tools that were available.

## Output format

Save the report as Markdown to the project's reports/research folder (or the output location in use), with a descriptive kebab-case filename like `content-research-<niche>-<date>.md`. If the user asks for a document, build it with the docx skill instead. Structure:

```
# Content Research Report: [Niche / Topic]

Market: [country]  |  Audience: [who]  |  Date: [date]
Tools used: [what was actually connected and used]  |  Confidence: [high/medium/directional]

## Trending Now
5-10 timely hooks, each with one line on why it's live right now.

## Questions the Audience Is Asking
Grouped by sub-theme, in the audience's own words. Note which suit featured-snippet / FAQ formats.

## Top Topic Opportunities
| Topic / Keyword | Volume | Difficulty | Traffic Potential | Intent | Opportunity Score | Notes |
(Omit metric columns if no keyword tool was connected; rank qualitatively and say so.)

**Quick wins to target first:** 3-5 items with one-line rationale.

## Competitor & SERP Context
For the top 2-3 topics: who ranks, dominant content type, SERP features, the gap to exploit.

## Strategic Summary
- 2-3 lines on the overall landscape.
- Recommended content priorities (ranked, with rationale).
- What to do first.
```

## Best practices

Start broad then narrow: general seed first, then drill into the subtopics with the best signal. Balance demand against winnability; a low-volume, low-competition topic you can own beats a high-volume one you cannot. Treat verbatim audience questions as first-class; they are the most reusable output. Always validate the top picks against what already ranks before recommending them. State your tool coverage and confidence honestly, every time.

## Common mistakes to avoid

Do not present estimated numbers as if they were measured metrics. Do not skip the trend pass and hand back a static evergreen list; the timeliness is half the value. Do not return an unfiltered dump of 100 keywords; the value is the prioritization. Do not block or apologize when a paid tool is missing; use the next source and note the limit. Do not ignore intent; a transactional keyword and an informational one need completely different content.
