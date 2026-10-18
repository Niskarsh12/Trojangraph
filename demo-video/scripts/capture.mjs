// Captures crisp stills of the real TrojanGraph app (live FalkorDB Cloud) plus element
// geometry and real scan logs, so Remotion can animate them smoothly frame-by-frame.
// Usage: node scripts/capture.mjs   (app must be running on http://localhost:3000)
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const APP = process.env.APP_URL || "http://localhost:3000";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const VIEW = { width: 1920, height: 1080 };
const SHOTS = path.resolve("public/shots");
const DATA = path.resolve("src/data");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCENARIOS = {
  plaid:
    "[GitHub] Issue #402 opened by @dev_dan_99\nTitle: Distributed memory sync timeout on 50 nodes\n\nRunning the community edition across a 50-node cluster. Memory sync between replicas times out after ~30s under sustained write load and the leader election flaps. We need HA replication with automatic failover before we can take this to production. Is there a supported clustering path?",
  stripe:
    "[GitHub] PR #88 opened by @ksato-sre\nTitle: bench: connection pooling under high concurrency\n\nOur SRE team is benchmarking connection pooling under high concurrency (20k concurrent clients). p99 latency spikes once the pool saturates. This PR adds a reproducible benchmark harness; curious whether the enterprise tier ships an adaptive pooling proxy.",
};

async function box(locator) {
  const b = await locator.boundingBox();
  if (!b) throw new Error(`Not visible: ${locator}`);
  return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
}

const card = (page, text) =>
  page.getByText(text, { exact: true }).locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]");

async function shot(page, name) {
  await page.mouse.move(VIEW.width - 2, VIEW.height - 2);
  await sleep(350);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  console.log(`  shot ${name}.png`);
}

/** Node boxes + glowing path-edge polylines, sampled from the live SVG in screen space. */
async function graphGeometry(page) {
  return page.evaluate(() => {
    const nodes = {};
    document.querySelectorAll(".react-flow__node").forEach((el) => {
      const label = el.querySelector("span.truncate")?.textContent?.trim();
      if (!label) return;
      const r = el.getBoundingClientRect();
      nodes[label] = { x: r.x, y: r.y, w: r.width, h: r.height };
    });
    const edges = [];
    document.querySelectorAll(".react-flow__edge.tg-edge-path").forEach((g) => {
      const id = (g.getAttribute("data-id") || g.getAttribute("data-testid") || "").replace(/^rf__edge-/, "");
      const p = g.querySelector("path.react-flow__edge-path");
      if (!p) return;
      const len = p.getTotalLength();
      const m = p.getScreenCTM();
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const pt = p.getPointAtLength((len * i) / 48);
        pts.push([+(pt.x * m.a + pt.y * m.c + m.e).toFixed(1), +(pt.x * m.b + pt.y * m.d + m.f).toFixed(1)]);
      }
      const type = id.split(":")[0];
      const [source, target] = id.slice(type.length + 1).split("->");
      edges.push({ id, source, target, pts });
    });
    return { nodes, edges };
  });
}

/** Orders path edges into a single founder -> buyer chain of points. */
function chainPath(edges) {
  const bySource = new Map(edges.map((e) => [e.source, e]));
  const targets = new Set(edges.map((e) => e.target));
  let cur = edges.find((e) => !targets.has(e.source));
  const pts = [];
  while (cur) {
    pts.push(...(pts.length ? cur.pts.slice(1) : cur.pts));
    cur = bySource.get(cur.target);
  }
  return pts;
}

async function scanLogs(request, text) {
  const res = await request.post(`${APP}/api/scan`, { data: { text } });
  const events = (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const logs = events.filter((e) => e.type === "log").map((e) => e.log);
  const result = events.find((e) => e.type === "result")?.result;
  if (!result) throw new Error("Scan produced no result: " + JSON.stringify(events.at(-1)));
  return {
    logs: logs.map(({ step, cypher, serverMs, roundTripMs, rows, status }) => ({ step, cypher, serverMs, roundTripMs, rows, status })),
    result: {
      champion: result.champion,
      buyer: result.buyer,
      company: result.company,
      feature: result.feature,
      path: result.path,
      investor: result.investor,
      handle: result.handle,
      platform: result.platform,
      signalRef: result.signalRef,
      timings: result.timings,
      nodeCount: result.graph.nodes.length,
      edgeCount: result.graph.edges.length,
    },
  };
}

async function runScan(page, cardName) {
  await page.getByRole("button", { name: new RegExp(`^0\\d\\s*${cardName}`) }).click();
  await page.getByRole("button", { name: /Execute Infiltration Scan/ }).click();
  await page.getByText("Resolved", { exact: true }).waitFor({ timeout: 30000 });
  await page.getByText("Subject", { exact: true }).waitFor({ timeout: 30000 });
  await sleep(2600);
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(DATA, { recursive: true });

  const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ["--hide-scrollbars"] });
  const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, colorScheme: "dark" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: APP });
  const page = await context.newPage();

  console.log("Fetching real scan logs from /api/scan...");
  const plaidScan = await scanLogs(page.request, SCENARIOS.plaid);
  const stripeScan = await scanLogs(page.request, SCENARIOS.stripe);

  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByText(/CONNECTED \(/).waitFor({ timeout: 30000 });
  await sleep(800);

  const layout = {};
  layout.status = await box(page.getByText(/CONNECTED \(/));
  layout.plaidCard = await box(page.getByRole("button", { name: /^0\d\s*Plaid/ }));
  layout.stripeCard = await box(page.getByRole("button", { name: /^0\d\s*Stripe/ }));
  layout.execute = await box(page.getByRole("button", { name: /Execute Infiltration Scan/ }));
  layout.terminal = await box(page.getByText("Cypher Execution Log").locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]"));
  layout.leftPanel = await box(page.locator("main > section").nth(0));
  layout.canvas = await box(page.locator("main > section").nth(1));
  layout.dossier = await box(page.locator("main > section").nth(2));
  await shot(page, "s0-empty");

  await page.getByRole("button", { name: /^0\d\s*Plaid/ }).click();
  await shot(page, "s1-plaid-selected");

  console.log("Running Plaid scan in the UI...");
  await page.getByRole("button", { name: /Execute Infiltration Scan/ }).click();
  await page.getByText("Resolved", { exact: true }).waitFor({ timeout: 30000 });
  await page.getByText("Subject", { exact: true }).waitFor({ timeout: 30000 });
  await sleep(2600);
  const plaidGeo = await graphGeometry(page);
  layout.plaid = {
    target: await box(card(page, "Target Account")),
    champion: await box(card(page, "Technical Champion")),
    buyer: await box(card(page, "Economic Buyer")),
    path: await box(card(page, "Warm Intro Path")),
    nodes: plaidGeo.nodes,
    pathPoints: chainPath(plaidGeo.edges),
  };
  await shot(page, "s2-plaid-result");

  await page.locator("main > section").nth(2).locator(".tg-scroll").first().evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  await sleep(500);
  layout.plaid.email = await box(page.getByText("Warm Intro Draft").locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]"));
  layout.plaid.copy = await box(page.getByRole("button", { name: /Copy Briefing/ }));
  layout.plaid.push = await box(page.getByRole("button", { name: /Push to Slack/ }));
  await shot(page, "s3-plaid-email");
  await page.getByRole("button", { name: /Copy Briefing/ }).click();
  await shot(page, "s3b-plaid-copied");

  await page.locator("main > section").nth(2).locator(".tg-scroll").first().evaluate((el) => el.scrollTo({ top: 0 }));
  console.log("Running Stripe scan in the UI...");
  await runScan(page, "Stripe");
  const stripeGeo = await graphGeometry(page);
  layout.stripe = {
    path: await box(card(page, "Warm Intro Path")),
    nodes: stripeGeo.nodes,
    pathPoints: chainPath(stripeGeo.edges),
  };
  await shot(page, "s4-stripe-result");

  fs.writeFileSync(path.join(DATA, "layout.json"), JSON.stringify(layout, null, 2));
  fs.writeFileSync(path.join(DATA, "plaid-scan.json"), JSON.stringify(plaidScan, null, 2));
  fs.writeFileSync(path.join(DATA, "stripe-scan.json"), JSON.stringify(stripeScan, null, 2));
  console.log("Wrote src/data/layout.json, plaid-scan.json, stripe-scan.json");
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
