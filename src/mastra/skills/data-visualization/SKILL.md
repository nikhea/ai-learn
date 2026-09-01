---
name: data-visualization
version: 1.0.0
author: Grace Leung
description: "Transform any dataset into a polished, interactive single-file HTML dashboard with auto-selected chart types, KPI cards, and storytelling insights. Use this skill whenever the user asks to create a dashboard, data visualization, data viz, HTML report, interactive report, or wants to visualize data, chart metrics, or turn a CSV, spreadsheet, JSON, or any dataset into visual charts or a dashboard. Also trigger when the user says 'visualize this', 'chart this data', 'make a report from this data', 'show me the trends', or any request that involves converting raw data into a visual, presentation-ready format, even if they don't explicitly say 'dashboard' or 'chart'. Brand-agnostic: applies project brand colors and fonts when available, otherwise uses a clean default palette."
---

# Data Visualization Dashboard

This skill takes any dataset and produces a single self-contained HTML file with an interactive, presentation-ready dashboard. The dashboard uses Chart.js (loaded from CDN) for charting, applies brand colors and fonts when available, and auto-selects chart types based on the data shape so the user never has to specify them.

The output should look like something a marketing manager would screenshot for a slide deck: animated KPI counters, scroll-reveal charts, hover interactions, subtle card shadows, rounded corners, and a one-line insight annotation on every chart that tells the viewer what to take away.

## Before You Start

### Scan for Brand Context First (always)

Before building anything, scan the project for a brand context location (a folder or file holding brand colors, typography, and tone; names vary between projects, identify it by contents, not a fixed path). This is a required first step. If a brand style guide exists, you must inherit it: extract these design tokens and apply them to the dashboard so the visualization is on-brand by default rather than generically styled.

| Token | Source |
|-------|--------|
| Primary color | Brand style guide, primary brand color |
| Secondary color | Brand style guide, secondary color |
| Light accent | Brand style guide, accent/tint |
| Background color | Brand style guide, background |
| Accent color | Brand style guide, additional accent |
| Text color | Brand style guide, body text color |
| Heading font | Brand typography, heading typeface |
| Body font | Brand typography, body typeface |

**If no brand context exists**, fall back to this clean default palette:

| Token | Default |
|-------|---------|
| Primary | `#1e3a5f` |
| Secondary | `#4a90d9` |
| Light accent | `#a8d0e6` |
| Background | `#f5f5f0` |
| Accent | `#7a9a5b` |
| Text | `#2b2b2b` |
| Heading font | `'Inter', sans-serif` |
| Body font | `'Inter', sans-serif` |

Build a chart color palette of 6 to 8 colors from the tokens: start with primary and secondary, then expand with accents and calculated complementary shades. This palette colors the chart series so every chart feels consistent and on-brand.

### Understand the Data

Before writing any HTML, analyze the dataset thoroughly:

1. **Identify column types**: dates/times, categories, numeric values, percentages, currencies, counts.
2. **Identify relationships**: which columns are dimensions (group-by) vs. measures (aggregate).
3. **Spot the story**: what are the top-level KPIs? What trends, comparisons, or distributions does this data reveal?
4. **Note the grain**: daily, weekly, monthly? Per-product, per-region, per-campaign?

This analysis drives every decision downstream: chart type, KPI card content, and insight annotations.

## Chart Type Selection

Auto-select chart types based on data shape. The user should never need to specify a chart.

| Data Pattern | Chart Type | When to Use |
|---|---|---|
| Values over time (dates on one axis) | Line chart | Time series with continuous trends. Area fill if single series. |
| Comparing categories (< 8 items) | Horizontal bar chart | Categorical comparisons; easier to read with long labels. |
| Comparing categories (8+ items) | Vertical bar chart | Many categories where horizontal would be too tall. |
| Parts of a whole (< 7 segments) | Doughnut chart | Percentage breakdowns, market share, budget allocation. Never pie. |
| Two numeric variables | Scatter plot | Correlation, performance quadrants. |
| Distribution of one variable | Histogram (binned bar) | Frequency distribution, spread. |
| Ranking / top-N | Horizontal bar, sorted desc | Leaderboard data; biggest bar on top. |
| Before/after or A vs B | Grouped bar chart | Side-by-side comparisons. |
| Multiple metrics over time | Multi-line chart | Comparing trends across series. Max 5 lines. |
| Single headline number | KPI card (not a chart) | Total revenue, conversion rate, AOV. Put in the KPI row. |

**Rules:** never use 3D, radar, or gauge charts. Never use pie; always doughnut. If a chart has more than 5 to 6 series, consolidate the smallest into "Other." For time series, parse and sort dates chronologically and format labels sensibly ("Jan", "Feb", not raw ISO timestamps).

## Dashboard Layout

The HTML follows a fixed structure, in this order:

### 0. Branded Accent Bar
A thin 4px gradient bar at the very top of the page, outside the container, running primary to secondary to accent.

```css
.accent-bar { height: 4px; background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 50%, var(--color-accent) 100%); }
```

### 1. Header
Descriptive dashboard title (derived from the data, not literally "Dashboard"), subtitle with the data's date range and today's generation date, heading font, primary color title, `fadeUp` animation (0.6s).

### 2. KPI Cards Row
A small uppercase section label ("Key Metrics") in the secondary color, then 3 to 5 cards for the most important top-level metrics. Each card: a label, a large formatted number, and a trend/context line. Features: colored top border (`border-top: 3px solid`, varying brand colors), animated number counters from 0 (requestAnimationFrame, ease-out, ~1.2s, driven by `data-target`/`data-prefix`/`data-suffix`/`data-format`), staggered fade-in delays, hover lift (`translateY(-3px)` + deeper shadow). White background, subtle shadow, 14px radius, generous padding.

### 3. Key Takeaways
A short narrative block (3 to 5 sentences) telling the high-level story before the charts: lead with the single most important finding, call out 1 to 2 supporting trends or surprises, end with a forward-looking implication if the data supports one. Write in the brand voice if context was loaded; otherwise clean and professional. Styling: soft gradient background (light accent to accent), left border in the accent color, heading with a small filled circle marker, fade-in on load.

### 4. Charts Grid
A section label ("Performance Breakdown") in secondary color, then charts in a responsive CSS grid (2 columns wide, 1 narrow). Each chart card: same styling and hover lift as KPI cards; **scroll reveal** via IntersectionObserver (`threshold: 0.15`, unobserve after triggering). Each card contains a chart title with an accent dot matching the series color, the Chart.js canvas, and a one-sentence **insight annotation** below (muted, separated by a thin top border). Order charts by importance.

### 5. Footer
Small muted text: "Generated on [date] | Data source: [filename or description]". Include the brand name in bold if context was loaded.

### Section Labels
```css
.section-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-secondary); margin-bottom: 14px; }
```

## Writing the HTML

Single `.html` file. Everything (CSS, JS, data) inlined. No external dependencies except Chart.js from CDN.

### Template Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Dashboard Title]</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <style>/* CSS variables, layout, cards, animations, responsive */</style>
</head>
<body>
  <div class="accent-bar"></div>
  <div class="container">
    <!-- Header (fadeUp) -->
    <!-- Section label: "Key Metrics" -->
    <!-- KPI Cards (staggered fadeUp, animated counters) -->
    <!-- Key Takeaways (fadeUp) -->
    <!-- Section label: "Performance Breakdown" -->
    <!-- Chart Cards (class="reveal" for scroll animation) -->
    <!-- Footer -->
  </div>
  <script>/* Counter animation, IntersectionObserver, Chart.js init */</script>
</body>
</html>
```

### CSS Guidelines
Define brand tokens as CSS custom properties at the top so they cascade:
```css
:root {
  --color-primary: #1e3a5f;
  --color-secondary: #4a90d9;
  --color-accent-light: #a8d0e6;
  --color-bg: #f5f5f0;
  --color-accent: #7a9a5b;
  --color-text: #2b2b2b;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --radius: 14px;
  --shadow: 0 2px 8px rgba(0,0,0,0.07);
  --shadow-hover: 0 8px 24px rgba(0,0,0,0.12);
}
```
Key rules: `box-sizing: border-box` everywhere; body uses `--color-bg`, cards white; max-width container 1200px centered; charts grid `repeat(auto-fit, minmax(500px, 1fr))` gap 24px; KPI row flex-wrap with cards `flex: 1; min-width: 180px`; all cards white bg, `var(--radius)`, `var(--shadow)`, 24px padding; hover transition on all cards; at `max-width: 768px` charts go single-column and KPI cards stack; headings use heading font, body uses body font; insight annotations muted italic, separated by a thin top border.

### Animations
```css
@keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
```
Apply to header, KPI cards (staggered delays), and Key Takeaways. Scroll reveal on chart cards:
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```
```css
.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }
```

### Chart.js Configuration
Apply clean, presentation-ready defaults to every chart: `responsive: true`, `maintainAspectRatio: true`, `interaction: { mode: 'index', intersect: false }`, legend at bottom with point-style labels (hide legend for single-series charts), tooltip in brand primary at high opacity with rounded corners and padding.

Scale/axis rules: include axis titles with units ("Revenue ($)", not "Revenue"); remove x-axis grid lines, keep subtle y-axis grid (`rgba(0,0,0,0.05)`); hide axis border lines; format numbers with `toLocaleString()`; prefix currency, suffix `%`; `borderRadius: 8` and `barPercentage: 0.6-0.7` on bars. Line points: hollow white fill with colored border (`pointBackgroundColor: '#fff'`, `pointBorderWidth: 2.5`), `pointHoverRadius: 8`, `tension: 0.4`, `borderWidth: 2.5`. Assign palette colors in fixed order; doughnuts use the full palette with white segment borders (`borderWidth: 3, borderColor: '#fff'`); single-series bar/line uses primary with a lighter fill (rgba ~0.12).

## Insight Annotations

Every chart gets a one-line insight below it; this is the core of the storytelling. Good insights are specific, quantified, actionable:
- "Email drove 47% of conversions, outperforming paid search 2.3x"
- "Bookings dropped 18% in September as summer promotions ended"

Bad insights restate the title or say nothing ("This chart shows revenue by channel", "Performance varies"). Write in brand voice if loaded; otherwise clean and professional.

## Data Handling

**Supported inputs:** CSV (Read tool), JSON, data pasted in chat, spreadsheets, or tool outputs (analytics, search console).

**Processing:** read and parse; clean (missing values, whitespace, date normalization); aggregate to summarized views (not raw rows unless small); compute the 3 to 5 most meaningful KPIs; prepare/group/sort each chart's data; inline as compact JS variables with clean names.

## Output

Save to the project's reports/output folder with a descriptive kebab-case filename like `campaign-performance-dashboard-q1-2026.html`. After saving, present the file and suggest opening it in a browser.

## Common Mistakes to Avoid

Bare charts with no insight. Wrong chart type for the data shape. Too many charts (4 to 6 is the sweet spot; cap at 8). Ignoring brand context when it exists. Tiny unreadable text. Unformatted raw numbers. Pie charts (use doughnut). External dependencies beyond Chart.js. Non-responsive layout. Generic "Dashboard" title. Never set `pointStyleWidth` on legend labels (produces squashed ovals). Never set `maintainAspectRatio: false` without a fixed-height container (canvas expands infinitely); keep it `true` and control proportions with the canvas `height` attribute.
