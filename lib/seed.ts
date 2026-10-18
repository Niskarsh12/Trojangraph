import { writeQuery } from "./falkordb";

const FOUNDER = { name: "You", title: "Founder & Maintainer", company: "GraphDB Startup" };

const INVESTORS = [
  { name: "Alex Vance", firm: "Apex Capital", role: "Seed Lead", email: "alex@apexcap.com", round: "Seed" },
  { name: "Priya Raman", firm: "Northstar Ventures", role: "Series A Partner", email: "priya@northstar.vc", round: "Series A" },
  { name: "Marcus Webb", firm: "Angel (ex-Stripe)", role: "Angel Investor", email: "marcus@webb.vc", round: "Angel" },
  { name: "Elena Kowalski", firm: "Foundry Angels", role: "Angel Syndicate", email: "elena@foundryangels.com", round: "Angel" },
];

const COMPANIES = [
  { name: "Plaid", domain: "plaid.com", tier: "Enterprise Target", employee_count: 1200 },
  { name: "Capital One", domain: "capitalone.com", tier: "Enterprise Target", employee_count: 52000 },
  { name: "Stripe", domain: "stripe.com", tier: "Enterprise Target", employee_count: 8000 },
  { name: "Datadog", domain: "datadoghq.com", tier: "Network", employee_count: 6000 },
  { name: "Robinhood", domain: "robinhood.com", tier: "Network", employee_count: 2300 },
];

const EXECUTIVES = [
  { name: "Sarah Chen", title: "VP of Platform Engineering", email: "sarah.chen@plaid.com", company: "Plaid" },
  { name: "David Okafor", title: "VP of Cloud Infrastructure", email: "david.okafor@capitalone.com", company: "Capital One" },
  { name: "Maya Lindqvist", title: "VP of Reliability Engineering", email: "maya.l@stripe.com", company: "Stripe" },
  { name: "Tom Becker", title: "Director of Engineering", email: "tom.becker@datadoghq.com", company: "Datadog" },
  { name: "Rachel Kim", title: "VP of Engineering", email: "rachel.kim@robinhood.com", company: "Robinhood" },
];

// Every edge points away from the founder so directed and undirected shortestPath agree.
const EX_COLLEAGUES = [
  { from: "Alex Vance", to: "Sarah Chen", company: "Google", years: "2019-2022" },
  { from: "Priya Raman", to: "David Okafor", company: "AWS", years: "2016-2020" },
  { from: "Marcus Webb", to: "Tom Becker", company: "Stripe", years: "2014-2018" },
  { from: "Tom Becker", to: "Maya Lindqvist", company: "Square", years: "2018-2021" },
  { from: "Tom Becker", to: "Sarah Chen", company: "Dropbox", years: "2012-2015" },
  { from: "Elena Kowalski", to: "Rachel Kim", company: "Goldman Sachs", years: "2015-2019" },
];

const DEVELOPERS = [
  { name: "Dan Miller", title: "Senior Backend Engineer", work_email: "dan.m@plaid.com", company: "Plaid", manager: "Sarah Chen" },
  { name: "Lena Park", title: "Site Reliability Engineer", work_email: "lena.park@plaid.com", company: "Plaid", manager: "Sarah Chen" },
  { name: "Raj Patel", title: "Cloud Architect", work_email: "raj.patel@capitalone.com", company: "Capital One", manager: "David Okafor" },
  { name: "Kenji Sato", title: "Staff SRE", work_email: "kenji.sato@stripe.com", company: "Stripe", manager: "Maya Lindqvist" },
];

const ACCOUNTS = [
  { platform: "Discord", handle: "dan_in_the_cloud", developer: "Dan Miller" },
  { platform: "GitHub", handle: "dev_dan_99", developer: "Dan Miller" },
  { platform: "GitHub", handle: "lpark-sre", developer: "Lena Park" },
  { platform: "Discord", handle: "vpc_wrangler", developer: "Raj Patel" },
  { platform: "GitHub", handle: "rpatel-c1", developer: "Raj Patel" },
  { platform: "GitHub", handle: "ksato-sre", developer: "Kenji Sato" },
  { platform: "Discord", handle: "pool_party_kenji", developer: "Kenji Sato" },
];

const FEATURES = [
  {
    name: "HA Distributed Clustering",
    tier: "Enterprise",
    price_acv: 65000,
    keywords: ["cluster", "replica", "replication", "failover", "distributed", "memory sync", "leader election", "50 nodes"],
    evaluatedBy: "Plaid",
  },
  {
    name: "GovCloud Compliance & SAML SSO",
    tier: "Enterprise",
    price_acv: 120000,
    keywords: ["govcloud", "saml", "sso", "vpc", "privatelink", "audit", "compliance", "idp"],
    evaluatedBy: "Capital One",
  },
  {
    name: "Adaptive Connection Pooling",
    tier: "Enterprise",
    price_acv: 90000,
    keywords: ["pool", "pooling", "concurrency", "concurrent", "p99", "latency", "throughput", "benchmark"],
    evaluatedBy: "Stripe",
  },
];

export interface SeedStep {
  step: string;
  cypher: string;
  serverMs?: number;
  roundTripMs: number;
}

const INDEXES = [
  "CREATE INDEX FOR (a:Account) ON (a.handle)",
  "CREATE INDEX FOR (e:Executive) ON (e.name)",
  "CREATE INDEX FOR (f:Founder) ON (f.name)",
  "CREATE INDEX FOR (d:Developer) ON (d.name)",
  "CREATE INDEX FOR (c:Company) ON (c.name)",
];

const STEPS: { step: string; cypher: string; params?: Parameters<typeof writeQuery>[1] }[] = [
  { step: "Wipe graph", cypher: "MATCH (n) DETACH DELETE n" },
  {
    step: "Founder",
    cypher: "MERGE (f:Founder {name: $name}) SET f.title = $title, f.company = $company",
    params: FOUNDER,
  },
  {
    step: "Companies",
    cypher:
      "UNWIND $rows AS r MERGE (c:Company {name: r.name}) " +
      "SET c.domain = r.domain, c.tier = r.tier, c.employee_count = r.employee_count",
    params: { rows: COMPANIES },
  },
  {
    step: "Investors + BACKED_BY",
    cypher:
      "MATCH (f:Founder {name: 'You'}) UNWIND $rows AS r " +
      "MERGE (i:Investor {name: r.name}) SET i.firm = r.firm, i.role = r.role, i.email = r.email " +
      "MERGE (f)-[b:BACKED_BY]->(i) SET b.round = r.round",
    params: { rows: INVESTORS },
  },
  {
    step: "Executives",
    cypher:
      "UNWIND $rows AS r MATCH (c:Company {name: r.company}) " +
      "MERGE (e:Executive {name: r.name}) SET e.title = r.title, e.email = r.email, e.company = r.company " +
      "MERGE (e)-[:EMPLOYED_BY]->(c)",
    params: { rows: EXECUTIVES },
  },
  {
    step: "EX_COLLEAGUE_AT edges",
    cypher:
      "UNWIND $rows AS r MATCH (a {name: r.from}), (b:Executive {name: r.to}) " +
      "MERGE (a)-[x:EX_COLLEAGUE_AT]->(b) SET x.company = r.company, x.years = r.years",
    params: { rows: EX_COLLEAGUES },
  },
  {
    step: "Developers + MANAGES + EMPLOYED_BY",
    cypher:
      "UNWIND $rows AS r MATCH (c:Company {name: r.company}), (m:Executive {name: r.manager}) " +
      "MERGE (d:Developer {name: r.name}) SET d.title = r.title, d.work_email = r.work_email " +
      "MERGE (d)-[:EMPLOYED_BY]->(c) MERGE (m)-[:MANAGES]->(d)",
    params: { rows: DEVELOPERS },
  },
  {
    step: "Pseudonymous accounts + IDENTIFIED_AS",
    cypher:
      "UNWIND $rows AS r MATCH (d:Developer {name: r.developer}) " +
      "MERGE (a:Account {platform: r.platform, handle: r.handle}) MERGE (a)-[:IDENTIFIED_AS]->(d)",
    params: { rows: ACCOUNTS },
  },
  {
    step: "Product features + EVALUATING",
    cypher:
      "UNWIND $rows AS r MATCH (c:Company {name: r.evaluatedBy}) " +
      "MERGE (p:ProductFeature {name: r.name}) SET p.tier = r.tier, p.price_acv = r.price_acv, p.keywords = r.keywords " +
      "MERGE (c)-[:EVALUATING]->(p)",
    params: { rows: FEATURES },
  },
];

export async function seedGraph(): Promise<{ steps: SeedStep[]; nodes: number; edges: number }> {
  const steps: SeedStep[] = [];

  for (const cypher of INDEXES) {
    try {
      const r = await writeQuery(cypher);
      steps.push({ step: "Index", cypher, serverMs: r.serverMs, roundTripMs: r.roundTripMs });
    } catch {
      // Index already exists: FalkorDB has no CREATE INDEX IF NOT EXISTS.
    }
  }

  for (const s of STEPS) {
    const r = await writeQuery(s.cypher, s.params);
    steps.push({ step: s.step, cypher: s.cypher, serverMs: r.serverMs, roundTripMs: r.roundTripMs });
  }

  const counts = await writeQuery<{ nodes: number; edges: number }>(
    "MATCH (n) WITH count(n) AS nodes OPTIONAL MATCH ()-[r]->() RETURN nodes, count(r) AS edges",
  );
  const row = counts.rows[0] ?? { nodes: 0, edges: 0 };
  return { steps, nodes: Number(row.nodes), edges: Number(row.edges) };
}
