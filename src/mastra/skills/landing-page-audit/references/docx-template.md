# Word Document Template

Generate the audit report using docx-js. This template includes the section layout, formatting, and colors.

## Colors: brand-agnostic

The `COLORS` object below holds neutral professional defaults. **If the project context provides brand colors, override `primary`, `secondary`, `accent`, and `lightTint` with the brand's values.** Always keep the three score colors (`scoreGreen`/`scoreYellow`/`scoreRed`) as-is, since they signal performance and should read consistently across any brand.

## Complete Template Code

```javascript
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, BorderStyle, WidthType,
        HeadingLevel, ShadingType, VerticalAlign, PageBreak, LevelFormat,
        PageNumber } = require('docx');

// Colors (remove # for docx-js). Override the first four from project brand context if available.
const COLORS = {
  primary: "233D4D",       // Headings, table headers  (brand override OK)
  secondary: "215E61",     // Subheadings              (brand override OK)
  accent: "FE7F2D",        // Accent highlights, callouts (brand override OK)
  lightTint: "F5FBE6",     // Table row shading        (brand override OK)
  white: "FFFFFF",
  black: "000000",
  // Score colors keep regardless of brand
  scoreGreen: "22C55E",    // 7-10
  scoreYellow: "EAB308",   // 4-6
  scoreRed: "EF4444"       // 1-3
};

function getScoreColor(score) {
  if (score >= 7) return COLORS.scoreGreen;
  if (score >= 4) return COLORS.scoreYellow;
  return COLORS.scoreRed;
}

function scoreText(score, bold = true) {
  return new TextRun({ text: score.toFixed(1), bold, color: getScoreColor(score), size: 24 });
}

const tableBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: tableBorder, bottom: tableBorder, left: tableBorder, right: tableBorder };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: COLORS.primary, font: "Arial" },
        paragraph: { spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: COLORS.primary, font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: COLORS.secondary, font: "Arial" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: COLORS.secondary, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "recommendations", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "quick-wins", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Landing Page Conversion Audit", color: COLORS.secondary, size: 20 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "Page ", size: 20 }), new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
      new TextRun({ text: " of ", size: 20 }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 })
    ] })] }) },
    children: [
      // === COVER PAGE ===
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Landing Page")] }),
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Conversion Audit")] }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Audit Date: ${new Date().toLocaleDateString()}`, size: 24, color: COLORS.secondary })] }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Target Page", bold: true, size: 28, color: COLORS.primary })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{{TARGET_URL}}", size: 22 })] }),
      new Paragraph({ spacing: { before: 200 } }),
      // Competitor URLs (include only if competitors provided)
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Competitor Pages", bold: true, size: 28, color: COLORS.primary })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "{{COMPETITOR_URLS}}", size: 22 })] }),
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Overall Scores", bold: true, size: 32, color: COLORS.primary })] }),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "Target: ", bold: true, size: 28 }),
        new TextRun({ text: "{{TARGET_SCORE}}", bold: true, size: 36, color: COLORS.accent })
      ] }),
      new Paragraph({ children: [new PageBreak()] }),

      // === EXECUTIVE SUMMARY ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "{{EXECUTIVE_SUMMARY}}", size: 22 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // === SIDE-BY-SIDE COMPARISON === (omit for standalone audit)
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Side-by-Side Comparison")] }),
      new Table({
        columnWidths: [2340, 2340, 2340, 2340],
        rows: [
          new TableRow({ tableHeader: true, children: ["Criterion","Target","Competitor 1","Competitor 2"].map(h =>
            new TableCell({ borders: cellBorders, shading: { fill: COLORS.primary, type: ShadingType.CLEAR }, verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: COLORS.white, size: 22 })] })] })) }),
          // Use createComparisonRow() (below) for: Headline Clarity (20%), CTA Strength (25%),
          // Objection Handling (20%), Social Proof (15%), Persuasion Architecture (20%), Overall Score
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // === INDIVIDUAL PAGE BREAKDOWNS ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Individual Page Analysis")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Target: {{TARGET_URL}}")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Headline Clarity: "), scoreText(7.5)] }),
      new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "{{HEADLINE_EVIDENCE}}", size: 22 })] }),
      // Repeat per criterion; repeat the H2 block per page.
      new Paragraph({ children: [new PageBreak()] }),

      // === PRIORITIZED RECOMMENDATIONS ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Prioritized Recommendations")] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "High Impact", color: COLORS.accent })] }),
      new Paragraph({ numbering: { reference: "recommendations", level: 0 }, children: [new TextRun({ text: "{{HIGH_IMPACT_REC_1}}", size: 22 })] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Medium Impact", color: COLORS.secondary })] }),
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Low Impact", color: COLORS.primary })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // === QUICK WINS ===
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Quick Wins")] }),
      new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "These changes can be implemented immediately with minimal effort:", size: 22, italics: true })] }),
      new Paragraph({ numbering: { reference: "quick-wins", level: 0 }, spacing: { after: 150 }, children: [new TextRun({ text: "{{QUICK_WIN_1}}", size: 22 })] }),
      new Paragraph({ numbering: { reference: "quick-wins", level: 0 }, spacing: { after: 150 }, children: [new TextRun({ text: "{{QUICK_WIN_2}}", size: 22 })] }),
      new Paragraph({ numbering: { reference: "quick-wins", level: 0 }, spacing: { after: 150 }, children: [new TextRun({ text: "{{QUICK_WIN_3}}", size: 22 })] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("landing-page-audit.docx", buffer);
  console.log("Audit report saved to landing-page-audit.docx");
});
```

## Dynamic Builders

```javascript
function createScoreCell(score, isAltRow = false) {
  return new TableCell({
    borders: cellBorders,
    shading: { fill: isAltRow ? COLORS.lightTint : COLORS.white, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: score.toFixed(1), bold: true, color: getScoreColor(score), size: 24 })] })]
  });
}

function createComparisonRow(criterion, weight, scores, isAltRow = false) {
  const cells = [ new TableCell({
    borders: cellBorders,
    shading: { fill: isAltRow ? COLORS.lightTint : COLORS.white, type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text: `${criterion} (${weight}%)`, bold: true, size: 22 })] })]
  }) ];
  scores.forEach(score => cells.push(createScoreCell(score, isAltRow)));
  return new TableRow({ children: cells });
}

function createEvidenceList(items) {
  return items.map(item => new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text: item, size: 22 })] }));
}

function createRecommendation(text, impact, listRef) {
  const impactColors = { high: COLORS.accent, medium: COLORS.secondary, low: COLORS.primary };
  return new Paragraph({ numbering: { reference: listRef, level: 0 }, spacing: { after: 150 }, children: [
    new TextRun({ text: `[${impact.toUpperCase()}] `, bold: true, color: impactColors[impact], size: 22 }),
    new TextRun({ text, size: 22 })
  ] });
}
```

## Standalone Audit Adjustments (1 URL)

1. Remove "Competitor Pages" from the cover page.
2. Change the comparison table to 2 columns (Criterion, Target).
3. Focus the Executive Summary on strengths vs. best practices.
4. Base recommendations on conversion best practices, not competitor gaps.
