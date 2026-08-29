import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

const root = process.cwd();
const source = path.join(root, "Roamwise_Project_Report.md");
const output = path.join(root, "Roamwise_Project_Report.docx");
const green = "236B4B";
const dark = "1D2922";
const sage = "DFE9DF";
const cream = "F6F3EB";
const gray = "69756E";

const box = (text, fill = sage, color = dark) => new TableCell({
  shading: { type: ShadingType.CLEAR, fill },
  margins: { top: 150, bottom: 150, left: 120, right: 120 },
  verticalAlign: "center",
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, color, size: 19 })],
  })],
});

const arrow = (text = "→") => new TableCell({
  width: { size: 4, type: WidthType.PERCENTAGE },
  borders: {
    top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
  },
  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: green, size: 26 })] })],
});

function flow(title, nodes, subtitle) {
  const cells = [];
  nodes.forEach((node, index) => {
    cells.push(box(node, index === 0 || index === nodes.length - 1 ? green : sage, index === 0 || index === nodes.length - 1 ? "FFFFFF" : dark));
    if (index < nodes.length - 1) cells.push(arrow());
  });
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 260, after: 100 }, children: [new TextRun(title)] }),
    ...(subtitle ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: subtitle, italics: true, color: gray, size: 18 })] })] : []),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: cells })] }),
    new Paragraph({ spacing: { after: 220 } }),
  ];
}

function parallelFlow() {
  const border = { style: BorderStyle.SINGLE, color: "AFC4B5", size: 6 };
  const branch = (title, description) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: sage },
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 140, bottom: 140, left: 150, right: 150 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, bold: true, color: green, size: 20 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: description, color: gray, size: 17 })] }),
    ],
  });
  return [
    new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Agent Flow — Orchestrator and Three Agents")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "researchCountry() controls sequencing, parallel work, and consolidation", italics: true, color: gray })] }),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [
      new TableRow({ children: [box("researchCountry()\nMASTER ORCHESTRATOR", green, "FFFFFF")] }),
      new TableRow({ children: [arrow("↓")] }),
      new TableRow({ children: [box("AGENT 1 — FIND DESTINATIONS\nWeb research → exactly 3 selected places")] }),
      new TableRow({ children: [arrow("↓ returns destination list to orchestrator ↓")] }),
      new TableRow({ children: [
        branch("AGENT 2 — THINGS TO DO", "3–5 activities per place"),
        arrow("+") ,
        branch("AGENT 3 — VERIFY & SOURCE", "Confidence, warnings, sources"),
      ] }),
      new TableRow({ children: [arrow("↓"), arrow("↓"), arrow("↓")] }),
      new TableRow({ children: [box("researchCountry()\nCONSOLIDATE · MATCH · DEDUPLICATE", green, "FFFFFF")] }),
    ] }),
    new Paragraph({ spacing: { after: 240 } }),
  ];
}

function architectureOverview() {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Architecture at a Glance")] }),
    ...flow("User Request and Validation", ["User Chat", "Next.js Chat UI", "POST /api/chat", "ISO Country Validator"]),
    ...flow("Orchestration Entry", ["Valid Country + ISO", "researchCountry()", "Master Orchestrator"]),
    ...parallelFlow(),
    ...flow("Validated User Response", ["TripResultSchema", "API JSON Response", "Chat UI", "3 Destination Cards"]),
  ];
}

function richText(text) {
  const runs = [];
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);
  for (const part of parts) {
    if (part.startsWith("`") && part.endsWith("`")) runs.push(new TextRun({ text: part.slice(1, -1), font: "Consolas", color: green }));
    else if (part.startsWith("**") && part.endsWith("**")) runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    else runs.push(new TextRun(part.replace(/ {2}$/g, "")));
  }
  return runs;
}

function parseMarkdown(markdown) {
  const children = [];
  const lines = markdown.split(/\r?\n/);
  let inCode = false;
  let codeLang = "";
  let code = [];
  let inMermaid = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.filter((_, i) => i !== 1).map((cells, rowIndex) => new TableRow({ children: cells.map((cell) => new TableCell({
      shading: rowIndex === 0 ? { type: ShadingType.CLEAR, fill: green } : undefined,
      margins: { top: 90, bottom: 90, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, bold: rowIndex === 0, color: rowIndex === 0 ? "FFFFFF" : dark, size: 18 })] })],
    })) }));
    children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }), new Paragraph({ spacing: { after: 160 } }));
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) { flushTable(); inCode = true; codeLang = line.slice(3).trim(); inMermaid = codeLang === "mermaid"; code = []; }
      else {
        if (!inMermaid) children.push(new Paragraph({ shading: { type: ShadingType.CLEAR, fill: "EEF2EE" }, spacing: { before: 80, after: 120 }, children: [new TextRun({ text: code.join("\n"), font: "Consolas", size: 17 })] }));
        inCode = false; inMermaid = false; codeLang = ""; code = [];
      }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (/^\|.*\|$/.test(line)) { tableRows.push(line.slice(1, -1).split("|").map((cell) => cell.trim().replace(/\*\*/g, ""))); continue; }
    flushTable();
    if (!line.trim() || line === "---") continue;
    if (line.startsWith("# ")) continue;
    if (line.startsWith("## ")) children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: children.length > 0, children: richText(line.slice(3)) }));
    else if (line.startsWith("### ")) children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: richText(line.slice(4)) }));
    else if (line.startsWith("#### ")) children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: richText(line.slice(5)) }));
    else if (/^- \[[x ]\]/i.test(line)) children.push(new Paragraph({ indent: { left: 360 }, children: [new TextRun({ text: line.slice(2, 5).toLowerCase() === "[x]" ? "☑ " : "☐ ", color: green }), ...richText(line.slice(6))] }));
    else if (line.startsWith("- ")) children.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: richText(line.slice(2)) }));
    else if (/^\d+\. /.test(line)) children.push(new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: richText(line.replace(/^\d+\. /, "")) }));
    else if (line.startsWith("> ")) children.push(new Paragraph({ border: { left: { style: BorderStyle.SINGLE, color: green, size: 16, space: 10 } }, indent: { left: 260 }, children: [new TextRun({ text: line.slice(2), italics: true, color: gray })] }));
    else children.push(new Paragraph({ spacing: { after: 120, line: 300 }, children: richText(line) }));
  }
  flushTable();
  return children;
}

const markdown = fs.readFileSync(source, "utf8");
const body = parseMarkdown(markdown);
const titlePage = [
  new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ROAMWISE", bold: true, color: green, size: 28, characterSpacing: 180 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 260 }, children: [new TextRun({ text: "Travel Research Agent", bold: true, color: dark, size: 54 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160 }, children: [new TextRun({ text: "Multi-Agent Project Report", italics: true, color: gray, size: 28 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 700 }, children: [new TextRun({ text: "NEXT.JS  ·  OPENAI RESPONSES API  ·  HOSTED WEB SEARCH", bold: true, color: green, size: 18, characterSpacing: 80 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1100 }, children: [new TextRun({ text: `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, color: gray, size: 20 })] }),
];

const doc = new Document({
  creator: "Roamwise Project",
  title: "Roamwise Travel Research Agent — Project Report",
  description: "Architecture, agent flows, implementation guide, testing, and future work.",
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 220 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 220 } } } }] },
    ],
  },
  styles: {
    default: { document: { run: { font: "Aptos", size: 21, color: dark }, paragraph: { spacing: { after: 100, line: 290 } } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Aptos Display", size: 54, bold: true, color: dark } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Aptos Display", size: 34, bold: true, color: green }, paragraph: { spacing: { before: 280, after: 160 }, keepNext: true } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Aptos Display", size: 27, bold: true, color: dark }, paragraph: { spacing: { before: 230, after: 120 }, keepNext: true } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Aptos", size: 23, bold: true, color: green }, paragraph: { spacing: { before: 190, after: 90 }, keepNext: true } },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Roamwise Project Report  ·  ", color: gray, size: 17 }), new TextRun({ children: [PageNumber.CURRENT], color: green, size: 17 })] })] }) },
    children: [...titlePage, ...architectureOverview(), ...body],
  }],
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(output, buffer);
console.log(`Created ${output}`);
