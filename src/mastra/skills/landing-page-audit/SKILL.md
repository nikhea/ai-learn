---
name: landing-page-audit
version: 1.0.0
author: Grace Leung
description: "Audit any live landing page for conversion effectiveness and produce a professional audit report. Use this skill whenever a user wants to audit, review, analyze, or score a landing page or website for conversion optimization, evaluate headline clarity / CTA strength / social proof / objection handling / persuasion flow, compare a page against competitors, or says 'audit this landing page', 'review my landing page', 'score this page', 'how can I improve this page's conversion', or 'compare my page to [competitor]'. Accepts 1 target URL and up to 2 optional competitor URLs. Tool-agnostic page reading (Claude in Chrome when connected, otherwise web fetch). Scans project brand context first and reflects it in the report. Outputs a Markdown audit report by default, or a Word document if the user asks."
---

# Landing Page Conversion Audit

Audit a live landing page against a structured conversion framework and deliver a professional report a marketer can act on. Read the page, score it on five weighted criteria, optionally compare it to competitors, and output a report with evidence-backed findings and prioritized recommendations.

## Workflow

0. **Scan for brand context first (always)**: before auditing, scan the project for relevant brand context (a folder or files holding brand voice, positioning, audience, colors; names vary, identify by contents). This is a required first step. Use whatever exists to frame recommendations to this brand's audience and positioning, and to style the report if a Word version is requested.
1. **Collect URLs**: target URL (required) and up to 2 competitor URLs (optional).
2. **Read each page**: extract the real content (see Reading Pages, tool-agnostic).
3. **Score each page**: apply the 5-criteria framework (see [audit-framework.md](references/audit-framework.md)).
4. **Generate the report**: Markdown report by default (or a Word document if the user asks) with scores, evidence, comparison, and recommendations.

## Reading Pages (tool-agnostic)

Read the actual live page; never audit from memory or assumption. Use the best available method:

1. **Claude in Chrome, if connected** (best, renders JavaScript): create a tab, navigate to the URL, then `get_page_text` for content and `read_page` for structure. This handles client-rendered pages correctly.
2. **Web fetch, as fallback**: if Chrome tools aren't connected, fetch the URL. Note that fetch returns raw HTML without running JavaScript, so a client-rendered page may return a near-empty shell. If the fetched content is clearly a shell (loading spinner, "enable JavaScript", no body copy), say so and recommend connecting Claude in Chrome for an accurate read rather than scoring a blank page.

For each page, extract and analyze: headlines (H1, H2, subheads), CTAs (button text, placement, contrast, count), social proof (testimonials, logos, stats, reviews), objection handling (FAQs, guarantees, trust badges), and the page structure and flow.

## Scoring Framework

| Criterion | Weight | Focus |
|-----------|--------|-------|
| Headline Clarity | 20% | Who, what, why in the headline |
| CTA Strength | 25% | Prominence, action-oriented language |
| Objection Handling | 20% | Addresses hesitations proactively |
| Social Proof Placement | 15% | Third-party validation visible |
| Persuasion Architecture | 20% | Logical problem-to-action journey |

Score each criterion 1 to 10. Weighted overall: `(H*0.20) + (C*0.25) + (O*0.20) + (S*0.15) + (P*0.20)`.

See [audit-framework.md](references/audit-framework.md) for the detailed scoring rubrics and the evidence to collect for each criterion.

## Generating the Report

Default to a **Markdown report**: save a `.md` with the sections below, using Markdown tables for the side-by-side comparison and clear headings per page. Note each score inline with its band label (Green 7-10, Yellow 4-6, Red 1-3) since Markdown can't color text. Reflect the brand context loaded in Step 0 in the framing and recommendations.

**Only if the user asks for a Word document**, build it with the docx skill: **read [docx-template.md](references/docx-template.md) before generating**; it contains the docx-js code template, the section layout, and the color coding.

### Report Sections

1. **Cover Page**: target URL, competitor URLs (if any), audit date, overall scores.
2. **Executive Summary**: one paragraph on overall positioning and the single biggest opportunity (or, for a standalone audit, the biggest strength and weakness).
3. **Side-by-Side Comparison Table**: all pages scored across the 5 criteria, color-coded (omit if standalone).
4. **Individual Page Breakdowns**: detailed analysis per page with concrete evidence quoted from the page content.
5. **Prioritized Recommendations**: 5 to 7 items labeled High / Medium / Low impact (prioritize by criterion weight: CTA gaps at 25% matter more than social proof at 15%).
6. **Quick Wins**: 3 changes implementable immediately.

### Report Styling (Word version)

When building the Word version, apply the project's brand colors and fonts if the context provides them. Otherwise use this clean, neutral professional default (defined in the docx template):

- Primary `#233D4D` (headings, table headers)
- Secondary `#215E61` (subheadings)
- Accent `#FE7F2D` (highlights, score callouts)
- Light tint `#F5FBE6` (table row shading)

**Score color coding** (keep these regardless of brand, they signal performance): Green 7 to 10 `#22C55E`, Yellow 4 to 6 `#EAB308`, Red 1 to 3 `#EF4444`.

## Standalone Audit (1 URL only)

If only the target URL is provided: skip the competitor comparison table, focus the executive summary on strengths and weaknesses, and base recommendations on conversion best practices rather than competitor gaps. The docx template notes how to adjust (2-column table, no competitor sections).
