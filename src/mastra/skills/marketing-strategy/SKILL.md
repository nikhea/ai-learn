---
name: marketing-strategy
version: 1.0.0
author: Grace Leung
description: "Turn a goal, brief, or research into a structured marketing strategy proposal. Use this skill whenever a marketer wants a marketing strategy, a strategy proposal, a go-to-market or campaign strategy, a channel plan, a content strategy, or a quarterly/launch plan, or says 'build a marketing strategy for [x]', 'write a strategy proposal', 'put together a GTM plan', 'what should our marketing strategy be', 'turn this into a strategy doc', or hands over research/notes and asks for a plan. Produces a structured proposal with objectives, audience, positioning, channel strategy, a phased roadmap, budget guidance, and success metrics, as a Markdown report by default (or a Word document if the user asks). Brand-agnostic: scans project context first if present, otherwise gathers the inputs it needs before proposing."
---

# Marketing Strategy

Turn a marketing goal into a clear, defensible strategy proposal a marketer can present to a client, a manager, or themselves and act on. The output is a structured document: what we're trying to achieve, who we're talking to, how we'll position, which channels we'll use and why, a phased roadmap, what it costs, and how we'll know it worked.

This is a planning skill. It produces a strategy, not the assets; the copy, ads, and visuals are built by other skills once the strategy is approved. Every recommendation must be justified, not asserted; a strategy the reader can't follow the reasoning of is just a list of tactics.

## Step 1: Gather the inputs

A strategy is only as good as its inputs. Establish these before writing. **Scan the project context first** (brand, audience, voice, offer, prior research, any goals; identify files by contents, names vary) — this is a required first step, and whatever brand context exists must be baked into the strategy so positioning, audience, and channels fit this brand rather than a generic one. Fill remaining gaps by asking the user in a single message:

- **Objective:** the business goal and, ideally, a measurable target and timeframe (e.g. "300 qualified leads in Q3", "launch product X in September", "grow trial signups 25%"). A vague objective produces a vague strategy.
- **Audience:** who we're trying to reach, their pains, and where they pay attention.
- **Offer & positioning starting point:** what's being marketed and how it's currently positioned.
- **Constraints:** budget range, team/capacity, timeline, channels already in use, and anything off-limits.
- **Context:** competitors, current performance, what's worked or failed before.

If research is missing and the decision hinges on it (demand, competitor angles, audience language), run or recommend the content-research skill first rather than guessing.

## Step 2: Build the strategy

Read [strategy-framework.md](references/strategy-framework.md) for the full reasoning model. Work through it in order; each section feeds the next.

The spine:

1. **Situation**: a short, honest read of where things stand (market, audience, competition, current performance). Name the core challenge or opportunity the strategy answers.
2. **Objectives**: the goal restated as specific, measurable outcomes with timeframes. Separate the primary objective from supporting ones.
3. **Target audience**: the priority segment(s), their pains and triggers, and the language they use. If there are several, rank them; a strategy that targets everyone targets no one.
4. **Positioning & core message**: the single idea the audience should take away, why it's credible, and how it's differentiated. Everything downstream ladders up to this.
5. **Channel strategy**: which channels, in what role (acquisition / nurture / conversion / retention), and *why each fits this audience and objective*. Justify inclusions and exclusions. Don't list every channel; pick the ones that earn their place.
6. **Roadmap / phasing**: the plan over time, in phases (e.g. foundation, launch, scale) or a week-by-week calendar for a campaign. Show sequence and dependencies, not just a pile of tactics.
7. **Budget & resourcing**: how effort and spend split across channels and phases, tied to expected return. Use ranges and clear assumptions when exact numbers aren't given.
8. **Success metrics**: the KPIs that prove the objective, leading and lagging, with targets and a review cadence. Define what "working" looks like before launch.
9. **Risks & assumptions**: the main risks and the assumptions the plan rests on, so the reader can pressure-test it.

Make trade-offs explicit. A strategy is a set of choices; saying what you're *not* doing, and why, is as valuable as what you are.

## Step 3: Produce the document

Default to a structured **Markdown report**. Save a `.md` to the project's strategy/output location with: a title block (title, client/brand, date), an executive summary (the whole strategy in one section a busy reader can absorb), then the nine sections above as clear headings, Markdown tables for the channel plan / roadmap / budget / metrics, and a short closing recommendation. Reflect the brand throughout (its language, positioning, audience) using the context loaded in Step 1.

**Only if the user asks for a Word document** (e.g. to present to a client or stakeholder), read the docx skill and build the same structure as a `.docx` with a cover page, applying the brand's colors and fonts if the project context provides them, otherwise a clean, neutral professional palette.

Use a descriptive kebab-case filename like `marketing-strategy-<objective-or-brand>-<date>`, then present it.

## Principles to hold

Justify every recommendation; the reasoning is the product. Tie every tactic back to an objective; if it doesn't serve one, cut it. Be specific and realistic about budget, capacity, and timeline; an unachievable plan is worse than a modest one. Lead with the executive summary; most readers decide from it. Make the choices and trade-offs visible.

## Common mistakes to avoid

A tactics list with no strategy behind it (channels chosen for no stated reason). Objectives with no measurable target. Targeting "everyone." Positioning that's a feature list instead of a single differentiated idea. A roadmap that's a backlog with no sequence or phasing. Metrics bolted on at the end instead of defined against the objective. Ignoring stated constraints (budget, team, timeline). Inventing performance data or market facts instead of using research or marking them as assumptions.
