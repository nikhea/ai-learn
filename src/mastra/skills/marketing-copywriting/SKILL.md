---
name: marketing-copywriting
version: 1.0.0
author: Grace Leung
description: "Write publish-ready marketing copy in the brand's voice across formats: blog posts, emails and newsletters, social posts, ad copy, and landing page sections. Use this skill whenever a marketer wants to draft, write, or rewrite content or copy, turn notes or research into a finished piece, repurpose one asset into another format, or says 'write a [blog/email/post/ad/landing page]', 'draft copy for [x]', 'turn this into a [format]', 'write this in our voice', 'give me headline/subject line options', or 'rewrite this to be punchier'. Applies modern AI-search and conversion writing patterns, pulls brand voice from project context when available, and asks for it when not. Brand-agnostic and standalone; works from a topic, a brief, research, or existing content to repurpose."
---

# Marketing Copywriting

Write finished, on-brand marketing copy in whatever format the marketer needs. This skill turns a topic, a brief, research, or an existing asset into publish-ready copy: structured, specific, in the brand voice, and formatted for both human skimming and machine extraction.

The one hard rule that keeps this credible: **do not fabricate facts, stats, quotes, or customer stories.** Use what the user supplies or what research provides. If a piece needs a fact you do not have, write around it so the copy still reads as finished; the human will always review before publishing, so do not invent the fact.

## Step 0: Scan for brand context first (always)

Before drafting anything, scan the project for relevant brand context (a folder or files holding brand voice, tone, messaging, audience, or positioning; names vary, identify by contents, not a fixed path). This is a required first step. If a brand voice or style guide exists, read it and write in that voice, applying its tone, vocabulary, and do's and don'ts throughout so the output is on-brand by default. If no voice file exists, ask for a short voice description or 1 to 2 example pieces before writing. Never invent a voice and never default to generic corporate.

## Step 1: Establish format, goal, and voice

Confirm (or infer from context) four things before writing:

- **Format:** blog post, email/newsletter, social post (and platform), ad copy (and channel), or landing page section. Each has a different shape (see Format Playbook).
- **Goal and audience:** what the piece should make the reader do or feel, and who they are.
- **Source material:** a topic to develop, a brief to follow, research to draw on, or an existing asset to repurpose. Use it; don't ignore it.
- **Brand voice.** Confirmed in Step 0 above; apply it throughout (tone, vocabulary, do's and don'ts). Re-check the loaded brand context here against the specific format before writing.

If several of these are unclear, ask in a single message, then write.

## Step 2: Apply the writing patterns (every format)

These hold regardless of format:

- **Lead with the point.** Open with the answer, the hook, or the value, then add depth. Never bury the lede under throat-clearing.
- **Be specific.** Concrete numbers, names, and examples over vague claims. Specific is believable and quotable; vague is filler.
- **Write for skimming and extraction.** Short paragraphs (2 to 4 sentences, one idea each), descriptive subheads, lists for any set of items or steps, a table for genuine comparisons, sparing bold on the key term. Front-load each paragraph's point in its first sentence. Do not over-format until it reads as noise.
- **One clear CTA.** Tell the reader the single next step, in voice, without a hard sell.
- **Cut the AI tells.** No em dashes, no "in today's fast-paced world", no rule-of-three padding, no hollow transitions like "moreover" / "furthermore" stacked up. Read it aloud in your head; if a human marketer wouldn't say it, cut it.

## Step 3: Format Playbook

Pick the shape that matches the format. Flex the body, keep the fundamentals.

### Blog post
SEO/AI-search structure. Open with a 1 to 2 sentence lead answer to the primary question (standalone, names the key entity). Then Key Takeaways (3 to 5 liftable bullets). Body in question-style H2s, each opening with its direct answer then depth, each section able to stand if lifted out of order. Close with an FAQ (each question phrased as people ask it, first sentence fully answers it) and a soft CTA. Provide final SEO metadata: title tag (50 to 60 chars), meta description (150 to 160), slug.

### Email / newsletter
Provide 3 to 5 subject line options and preview text. One core idea per email. Short, scannable, conversational. A single primary CTA (a secondary link is fine). Lead with the reader's benefit, not the sender's news. For a newsletter issue, use clear sections with skimmable subheads.

### Social post
Match the platform: LinkedIn (hook line, short stacked lines, white space, insight or story, soft CTA), X/Twitter (tight, one idea, thread only if it earns it), Instagram caption (hook + value + CTA + a few relevant hashtags). Always open with a scroll-stopping first line. Offer 2 to 3 hook variants when useful.

### Ad copy
Provide multiple variants (3 to 5) for testing. Respect the channel's structure (e.g. Google: headlines + descriptions within character limits; Meta: primary text + headline + description). Lead with the strongest benefit or hook, name the audience or pain, end with an explicit CTA. Note character counts.

### Landing page section
Write the requested sections: hero (headline + subhead + CTA), benefit blocks, social proof framing, objection handling/FAQ, final CTA. Headline must convey who it's for, what they get, and why it matters. Conversion-first: clarity over cleverness, one dominant CTA.

## Step 4: Repurposing

When turning one asset into another (blog into newsletter, transcript into social posts, webinar into ad copy): keep the core ideas and the brand voice, but re-shape fully to the destination format using the playbook above. A repurposed piece should read as native to its new format, not as a pasted excerpt. Pull the most quotable, highest-value points; drop what doesn't fit the new container.

## Step 5: Output

For short copy (social, ad variants, subject lines, a single section), return it directly in chat, clearly labeled. For long-form (blog post, full newsletter, multi-section landing page), save a Markdown file to the project's content/output location with a descriptive kebab-case name, and present it. If the user explicitly wants a Word doc, use the docx skill.

The human always reviews before publishing, so deliver finished copy rather than flagging gaps for them to fill.

## Quality checklist

- [ ] Brand context scanned first; voice pulled from it or requested, applied throughout, not invented or generic
- [ ] Format, goal, audience, and source material confirmed
- [ ] Leads with the point; specific, not vague; no fabricated facts
- [ ] Formatted for skim and extraction; not over-formatted
- [ ] One clear CTA, in voice, soft
- [ ] AI tells removed; no em dashes
- [ ] Format-specific elements present (e.g. blog: lead answer + takeaways + question H2s + FAQ + metadata; email: subject options + preview; ad/social: multiple variants with limits noted)
- [ ] Output saved/returned in the right form as finished, publish-ready copy
