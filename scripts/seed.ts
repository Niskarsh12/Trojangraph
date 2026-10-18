import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main() {
  const { seedGraph } = await import("../lib/seed");
  const { getDb } = await import("../lib/falkordb");

  console.log("Seeding TrojanGraph demo graph...");
  const { steps, nodes, edges } = await seedGraph();
  for (const s of steps) {
    const server = s.serverMs !== undefined ? `${s.serverMs.toFixed(2)}ms server` : "n/a";
    console.log(`  ✓ ${s.step.padEnd(40)} ${server} / ${s.roundTripMs.toFixed(1)}ms rtt`);
  }
  console.log(`Done: ${nodes} nodes, ${edges} relationships.`);
  await (await getDb()).close();
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
