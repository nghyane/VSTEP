const COLORS = {
  ink: "#172033",
  muted: "#5b6475",
  line: "#d9e1ea",
  pale: "#f6f8fb",
  orange: "#f37021",
  green: "#1fa463",
  blue: "#0c76bc",
  blueDark: "#0b3f75",
  white: "#ffffff",
};

const A = "/Users/nghiahoang/Dev/VSTEP/outputs/manual-20260530-141335/presentations/vstep-capstone/assets";

const slides = [
  {
    title: "An Adaptive VSTEP Preparation System",
    subtitle: "Comprehensive skill assessment and personalized learning support",
    type: "cover",
    body: ["Project code: SP26SE145", "Group: GSP26SE63", "Supervisor / team members"],
  },
  {
    title: "VSTEP Context",
    type: "bullets",
    body: [
      "VSTEP is a standardized English proficiency exam in Vietnam.",
      "Used for graduation, certification, and career requirements.",
      "Assesses four skills: Listening, Reading, Writing, Speaking.",
    ],
    side: ["Listening", "Reading", "Writing", "Speaking"],
  },
  {
    title: "Problem Statement",
    type: "bullets",
    body: [
      "Learners struggle to identify skill-level weaknesses.",
      "Practice websites often score only Listening and Reading.",
      "Writing and Speaking lack rubric-based feedback.",
      "Learning paths are rarely personalized.",
    ],
  },
  {
    title: "Existing Solutions & Gaps",
    type: "table",
    columns: ["Solution", "Strength", "Gap"],
    rows: [
      ["Training centers", "Teacher support", "Limited personalization"],
      ["Mock test websites", "Practice tests", "Missing Writing/Speaking assessment"],
      ["General English apps", "Easy to use", "Not aligned to VSTEP format"],
      ["AI writing tools", "Fast feedback", "Not based on VSTEP rubric"],
    ],
  },
  {
    title: "Proposed Solution",
    type: "imageRight",
    image: `${A}/proposed-solution-abstract.png`,
    body: [
      "Web and mobile platform for VSTEP preparation.",
      "Practice and mock tests across four skills.",
      "Rubric-based scoring for Writing and Speaking.",
      "Skill-gap recommendations and vocabulary SRS.",
      "Progress dashboard for learning visibility.",
    ],
  },
  {
    title: "Scope Alignment",
    type: "split",
    leftTitle: "Current capstone scope",
    left: [
      "Practice/mock test for four skills",
      "AI-supported feedback",
      "Rule-based learning path",
      "Vocabulary spaced repetition",
      "Dashboard, course, admin, content management",
    ],
    rightTitle: "Future work",
    right: [
      "Dynamic adaptive difficulty",
      "Predictive analytics with ML",
      "Teacher-assigned individual modules",
    ],
  },
  {
    title: "System Overview",
    type: "imageRight",
    image: `${A}/system-overview-abstract.png`,
    body: [
      "Learner, teacher, and admin access points.",
      "Web app, mobile app, and admin panel.",
      "Backend API, assessment engine, recommendation module.",
      "PostgreSQL, Redis, object storage, external AI and speech services.",
    ],
  },
  {
    title: "Main User Flow",
    type: "flow",
    flow: [
      "Register / Login",
      "Select target level",
      "Practice or mock test",
      "Receive score and feedback",
      "View skill gaps",
      "Follow recommendations",
      "Track progress",
    ],
  },
  {
    title: "Core Modules",
    type: "modules",
    body: [
      "Authentication & profile",
      "Practice mode",
      "Mock test mode",
      "Assessment engine",
      "Learning path",
      "Progress tracking",
      "Course/content/admin management",
      "Notification and feedback",
    ],
  },
  {
    title: "VSTEP Assessment Format",
    type: "skills",
    skills: [
      ["Listening", "Objective questions"],
      ["Reading", "MCQ, single correct answer"],
      ["Writing", "Task 1 + Task 2"],
      ["Speaking", "Recorded response / conversation"],
    ],
    note: "Target levels: B1-C1",
  },
  {
    title: "Scoring Principle",
    type: "imageRight",
    image: `${A}/scoring-principle-abstract.png`,
    body: [
      "AI does not decide the final score.",
      "AI supports evidence extraction and feedback.",
      "Final scores are calculated by system formulas.",
      "Rule caps and penalties handle abnormal answers.",
      "Results include an explainable trace.",
    ],
  },
  {
    title: "Writing Scoring Formula",
    type: "weights",
    items: [
      ["Task Fulfillment", 30, COLORS.orange],
      ["Organization", 20, COLORS.green],
      ["Grammar", 25, COLORS.blue],
      ["Vocabulary", 25, COLORS.blueDark],
    ],
  },
  {
    title: "Writing Signals",
    type: "table",
    columns: ["Criterion", "Signals"],
    rows: [
      ["Task Fulfillment", "topic relevance, completeness, viewpoint, examples"],
      ["Organization", "paragraphing, cohesion, structure"],
      ["Grammar", "error rate, structure variety"],
      ["Vocabulary", "lexical range, advanced words, spelling"],
    ],
  },
  {
    title: "Speaking Scoring Formula",
    type: "weights",
    items: [
      ["Grammar", 20, COLORS.orange],
      ["Vocabulary", 20, COLORS.green],
      ["Fluency", 20, COLORS.blue],
      ["Discourse", 20, COLORS.blueDark],
      ["Pronunciation", 20, "#8b5cf6"],
    ],
  },
  {
    title: "Speaking Signals",
    type: "bullets",
    body: [
      "Transcript supports grammar, vocabulary, and discourse analysis.",
      "Speaking rate and pause count inform fluency.",
      "Pronunciation score informs pronunciation assessment.",
      "Content relevance adjusts discourse/content interpretation.",
    ],
  },
  {
    title: "Guardrails for Abnormal Answers",
    type: "guardrails",
    body: ["Off-topic", "Too short", "Copied prompt", "Repeated or spam response", "Non-English answer"],
    key: "Abnormal answers are not scored by simple averaging; content caps prevent misleading high scores.",
  },
  {
    title: "Validation Strategy",
    type: "split",
    leftTitle: "Referenced benchmark samples",
    left: ["Compare predicted level with reference level", "Check consistency on selected samples"],
    rightTitle: "VSTEP-style risk cases",
    right: ["Verify abnormal answers are not scored high", "Check guardrail behavior under edge cases"],
  },
  {
    title: "Validation Results",
    type: "metrics",
    metrics: [
      ["9/9", "Referenced benchmark CEFR matched"],
      ["5/5", "VSTEP guardrail cases handled correctly"],
    ],
    note: "Validation demonstrates consistency on selected samples, not official examiner equivalence.",
  },
  {
    title: "Learning Path",
    type: "bullets",
    body: [
      "Analyze skill gaps from mock tests and practice.",
      "Recommend exercises for weaker skills.",
      "Use rule-based recommendation logic.",
      "Avoid claims of ML predictive analytics in current scope.",
    ],
  },
  {
    title: "Vocabulary Spaced Repetition",
    type: "bullets",
    body: [
      "Support vocabulary review using SRS / Anki-style scheduling.",
      "Prioritize words that need review.",
      "Connect vocabulary practice with personal learning progress.",
    ],
  },
  {
    title: "Deployment & Quality",
    type: "modules",
    body: ["Docker deployment", "GitHub Actions CI/CD", "PostgreSQL + Redis", "PHPUnit tests", "External services isolated by test doubles"],
  },
  {
    title: "Demo Scenario",
    type: "flow",
    flow: [
      "Login",
      "Start mock / practice",
      "Submit Writing / Speaking",
      "Background grading",
      "View score breakdown",
      "View feedback",
      "View skill gaps",
      "View recommendation",
    ],
  },
  {
    title: "Deliverables",
    type: "modules",
    body: [
      "Backend application",
      "Web application",
      "Mobile application",
      "Admin panel",
      "AI-supported scoring module",
      "Testing report",
      "Installation / user guide",
      "Final report and source code",
    ],
  },
  {
    title: "Conclusion & Future Work",
    type: "split",
    leftTitle: "Conclusion",
    left: [
      "Comprehensive support for VSTEP preparation",
      "Rubric-based scoring and feedback",
      "Learning path and progress tracking",
    ],
    rightTitle: "Future work",
    right: ["Dynamic adaptive difficulty", "Large-scale official benchmark", "ML-based predictive analytics"],
  },
];

function addChrome(slide, ctx, n) {
  ctx.addShape(slide, { x: 0, y: 0, w: 1280, h: 720, fill: COLORS.white });
  ctx.addShape(slide, { x: 0, y: 0, w: 12, h: 720, fill: COLORS.orange });
  ctx.addShape(slide, { x: 12, y: 0, w: 8, h: 720, fill: COLORS.green });
  ctx.addShape(slide, { x: 20, y: 0, w: 8, h: 720, fill: COLORS.blue });
  ctx.addText(slide, {
    text: "SP26SE145 | GSP26SE63",
    x: 52,
    y: 666,
    w: 280,
    h: 20,
    fontSize: 12,
    color: COLORS.muted,
  });
  ctx.addText(slide, {
    text: String(n).padStart(2, "0"),
    x: 1132,
    y: 666,
    w: 36,
    h: 20,
    fontSize: 12,
    color: COLORS.muted,
    align: "right",
  });
  return ctx.addImage(slide, {
    path: `${A}/fpt-logo.png`,
    x: 1184,
    y: 644,
    w: 58,
    h: 40,
    fit: "contain",
    alt: "FPT University logo",
  });
}

function title(slide, ctx, text) {
  ctx.addText(slide, {
    text,
    x: 68,
    y: 48,
    w: 900,
    h: 54,
    fontSize: 31,
    bold: true,
    face: ctx.fonts.title,
    color: COLORS.ink,
  });
  ctx.addShape(slide, { x: 68, y: 112, w: 96, h: 4, fill: COLORS.orange });
  ctx.addShape(slide, { x: 168, y: 112, w: 62, h: 4, fill: COLORS.green });
  ctx.addShape(slide, { x: 234, y: 112, w: 62, h: 4, fill: COLORS.blue });
}

function bullets(slide, ctx, list, x, y, w, size = 23, gap = 55) {
  list.forEach((item, i) => {
    const top = y + i * gap;
    ctx.addShape(slide, { x, y: top + 8, w: 9, h: 9, fill: [COLORS.orange, COLORS.green, COLORS.blue][i % 3] });
    ctx.addText(slide, { text: item, x: x + 26, y: top, w, h: 40, fontSize: size, color: COLORS.ink });
  });
}

function sectionBox(slide, ctx, x, y, w, h, head, items, color) {
  ctx.addShape(slide, { x, y, w, h, fill: COLORS.pale, line: ctx.line(COLORS.line, 1) });
  ctx.addShape(slide, { x, y, w, h: 48, fill: color });
  ctx.addText(slide, { text: head, x: x + 22, y: y + 12, w: w - 44, h: 30, fontSize: 20, bold: true, color: COLORS.white });
  bullets(slide, ctx, items, x + 24, y + 78, w - 68, 19, 43);
}

function table(slide, ctx, columns, rows) {
  const x = 86;
  const y = 158;
  const widths = columns.length === 2 ? [300, 760] : [270, 260, 530];
  ctx.addShape(slide, { x, y, w: widths.reduce((a, b) => a + b, 0), h: 46, fill: COLORS.blueDark });
  let cx = x;
  columns.forEach((c, i) => {
    ctx.addText(slide, { text: c, x: cx + 14, y: y + 12, w: widths[i] - 24, h: 24, fontSize: 17, bold: true, color: COLORS.white });
    cx += widths[i];
  });
  rows.forEach((r, ri) => {
    const ry = y + 46 + ri * 74;
    ctx.addShape(slide, { x, y: ry, w: widths.reduce((a, b) => a + b, 0), h: 74, fill: ri % 2 ? "#ffffff" : COLORS.pale, line: ctx.line(COLORS.line, 1) });
    let colX = x;
    r.forEach((cell, ci) => {
      ctx.addText(slide, { text: cell, x: colX + 14, y: ry + 17, w: widths[ci] - 24, h: 42, fontSize: ci === 0 ? 17 : 16, bold: ci === 0, color: ci === 0 ? COLORS.ink : COLORS.muted });
      colX += widths[ci];
    });
  });
}

function weights(slide, ctx, items) {
  const x = 118;
  const y = 162;
  const total = items.reduce((sum, [, value]) => sum + value, 0);
  let ox = x;
  items.forEach(([label, value, color]) => {
    const w = Math.round((value / total) * 920);
    ctx.addShape(slide, { x: ox, y, w, h: 78, fill: color });
    ctx.addText(slide, { text: `${value}%`, x: ox + 14, y: y + 14, w: w - 28, h: 32, fontSize: 28, bold: true, color: COLORS.white, align: "center" });
    ctx.addText(slide, { text: label, x: ox + 10, y: y + 50, w: w - 20, h: 24, fontSize: 14, color: COLORS.white, align: "center" });
    ox += w;
  });
  ctx.addText(slide, {
    text: "Final score = weighted criterion scores + rule-based caps / penalties when needed",
    x: 164,
    y: 310,
    w: 820,
    h: 52,
    fontSize: 24,
    bold: true,
    color: COLORS.ink,
    align: "center",
  });
  ctx.addShape(slide, { x: 170, y: 400, w: 810, h: 90, fill: COLORS.pale, line: ctx.line(COLORS.line, 1) });
  ctx.addText(slide, {
    text: "Rubric criteria remain explicit, traceable, and editable for academic review.",
    x: 220,
    y: 430,
    w: 710,
    h: 36,
    fontSize: 22,
    color: COLORS.muted,
    align: "center",
  });
}

function flow(slide, ctx, items) {
  const x0 = 78;
  const y0 = 166;
  const w = 252;
  const h = 64;
  items.forEach((item, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = x0 + col * 292;
    const y = y0 + row * 156;
    ctx.addShape(slide, { x, y, w, h, fill: COLORS.white, line: ctx.line([COLORS.orange, COLORS.green, COLORS.blue][i % 3], 2) });
    ctx.addText(slide, { text: item, x: x + 16, y: y + 17, w: w - 32, h: 34, fontSize: 18, bold: true, color: COLORS.ink, align: "center" });
    if (i < items.length - 1) {
      const lastInRow = col === 3;
      if (!lastInRow) {
        ctx.addText(slide, { text: "->", x: x + w + 12, y: y + 20, w: 28, h: 22, fontSize: 18, color: COLORS.muted, align: "center" });
      }
    }
  });
}

function modules(slide, ctx, items) {
  const x0 = 82;
  const y0 = 154;
  const w = 252;
  const h = 86;
  items.forEach((item, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = x0 + col * 282;
    const y = y0 + row * 124;
    ctx.addShape(slide, { x, y, w, h, fill: i % 2 ? "#ffffff" : COLORS.pale, line: ctx.line([COLORS.orange, COLORS.green, COLORS.blue][i % 3], 1.5) });
    ctx.addText(slide, { text: item, x: x + 18, y: y + 21, w: w - 36, h: 42, fontSize: 17, bold: true, color: COLORS.ink, align: "center" });
  });
}

export async function buildDeckSlide(presentation, ctx, index) {
  const data = slides[index - 1];
  const slide = presentation.slides.add();
  await addChrome(slide, ctx, index);
  if (data.type !== "cover") title(slide, ctx, data.title);

  if (data.type === "cover") {
    ctx.addShape(slide, { x: 76, y: 102, w: 760, h: 6, fill: COLORS.orange });
    ctx.addText(slide, { text: data.title, x: 76, y: 144, w: 920, h: 84, fontSize: 42, bold: true, face: ctx.fonts.title, color: COLORS.ink });
    ctx.addText(slide, { text: data.subtitle, x: 78, y: 248, w: 780, h: 48, fontSize: 24, color: COLORS.muted });
    bullets(slide, ctx, data.body, 82, 370, 620, 23, 54);
    ctx.addShape(slide, { x: 920, y: 132, w: 220, h: 220, fill: "#fff2e9", line: ctx.line(COLORS.orange, 2) });
    ctx.addText(slide, { text: "VSTEP", x: 936, y: 190, w: 188, h: 52, fontSize: 42, bold: true, color: COLORS.orange, align: "center" });
    ctx.addText(slide, { text: "4 skills | rubric scoring | learning path", x: 948, y: 252, w: 164, h: 60, fontSize: 16, color: COLORS.muted, align: "center" });
  } else if (data.type === "bullets") {
    bullets(slide, ctx, data.body, 110, 170, 920, 24, 70);
    if (data.side) {
      data.side.forEach((s, i) => {
        ctx.addShape(slide, { x: 142 + i * 240, y: 500, w: 190, h: 62, fill: [COLORS.orange, COLORS.green, COLORS.blue, COLORS.blueDark][i] });
        ctx.addText(slide, { text: s, x: 154 + i * 240, y: 518, w: 166, h: 28, fontSize: 18, bold: true, color: COLORS.white, align: "center" });
      });
    }
  } else if (data.type === "table") {
    table(slide, ctx, data.columns, data.rows);
  } else if (data.type === "imageRight") {
    bullets(slide, ctx, data.body, 82, 162, 505, 21, 60);
    await ctx.addImage(slide, { path: data.image, x: 675, y: 132, w: 500, h: 410, fit: "cover", alt: `${data.title} abstract illustration` });
    ctx.addShape(slide, { x: 675, y: 132, w: 500, h: 410, fill: "#00000000", line: ctx.line(COLORS.line, 1) });
  } else if (data.type === "split") {
    sectionBox(slide, ctx, 86, 164, 500, 352, data.leftTitle, data.left, COLORS.blueDark);
    sectionBox(slide, ctx, 650, 164, 500, 352, data.rightTitle, data.right, COLORS.green);
  } else if (data.type === "flow") {
    flow(slide, ctx, data.flow);
  } else if (data.type === "modules") {
    modules(slide, ctx, data.body);
  } else if (data.type === "skills") {
    data.skills.forEach(([skill, desc], i) => {
      const x = 114 + i * 268;
      ctx.addShape(slide, { x, y: 178, w: 218, h: 218, fill: [COLORS.orange, COLORS.green, COLORS.blue, COLORS.blueDark][i] });
      ctx.addText(slide, { text: skill, x: x + 16, y: 234, w: 186, h: 34, fontSize: 22, bold: true, color: COLORS.white, align: "center" });
      ctx.addText(slide, { text: desc, x: x + 24, y: 292, w: 170, h: 54, fontSize: 16, color: COLORS.white, align: "center" });
    });
    ctx.addText(slide, { text: data.note, x: 430, y: 476, w: 360, h: 38, fontSize: 28, bold: true, color: COLORS.ink, align: "center" });
  } else if (data.type === "weights") {
    weights(slide, ctx, data.items);
  } else if (data.type === "guardrails") {
    modules(slide, ctx, data.body);
    ctx.addShape(slide, { x: 128, y: 472, w: 950, h: 88, fill: "#fff7ed", line: ctx.line(COLORS.orange, 2) });
    ctx.addText(slide, { text: data.key, x: 162, y: 498, w: 882, h: 40, fontSize: 21, bold: true, color: COLORS.ink, align: "center" });
  } else if (data.type === "metrics") {
    data.metrics.forEach(([value, label], i) => {
      const x = 150 + i * 500;
      ctx.addShape(slide, { x, y: 172, w: 380, h: 214, fill: i ? "#eef7ff" : "#fff2e9", line: ctx.line(i ? COLORS.blue : COLORS.orange, 2) });
      ctx.addText(slide, { text: value, x: x + 30, y: 220, w: 320, h: 70, fontSize: 56, bold: true, color: i ? COLORS.blue : COLORS.orange, align: "center" });
      ctx.addText(slide, { text: label, x: x + 42, y: 306, w: 296, h: 42, fontSize: 18, color: COLORS.ink, align: "center" });
    });
    ctx.addText(slide, { text: data.note, x: 170, y: 472, w: 870, h: 44, fontSize: 20, color: COLORS.muted, align: "center" });
  }
  return slide;
}
