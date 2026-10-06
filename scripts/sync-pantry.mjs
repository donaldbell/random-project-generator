// Pulls the project generator pantry from Airtable and writes pantry.json for the public site.
// Needs AIRTABLE_TOKEN (a read-only personal access token) and AIRTABLE_BASE in the environment.
// Run locally with: AIRTABLE_TOKEN=pat... AIRTABLE_BASE=app... node scripts/sync-pantry.mjs
import { readFile, writeFile } from "node:fs/promises";

const token = process.env.AIRTABLE_TOKEN;
const base = process.env.AIRTABLE_BASE;
if (!token || !base) {
  console.error("Set AIRTABLE_TOKEN and AIRTABLE_BASE first.");
  process.exit(1);
}

async function fetchAll(table) {
  const rows = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`${table}: ${res.status} ${await res.text()}`);
    const json = await res.json();
    rows.push(...json.records);
    offset = json.offset;
  } while (offset);
  return rows;
}

const [bucketRows, itemRows] = await Promise.all([fetchAll("Buckets"), fetchAll("Ingredients")]);

const buckets = bucketRows
  .filter((r) => (r.fields["Name"] || "").trim())
  .map((r) => ({
    id: r.id,
    name: r.fields["Name"].trim(),
    group: r.fields["Group"] || "Flavor",
    order: Number(r.fields["Order"]) || 0,
    rolled: !!r.fields["Rolls by default"],
  }))
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

const bucketIds = new Set(buckets.map((b) => b.id));
const items = itemRows
  .filter((r) => !r.fields["Retired"] && (r.fields["Ingredient"] || "").trim())
  .map((r) => ({
    id: r.id,
    bucket: (r.fields["Bucket"] || [])[0],
    label: r.fields["Ingredient"].trim(),
    level: Math.min(3, Math.max(1, Number(r.fields["Level"]) || 1)),
    tags: r.fields["Provides"] || [],
    needs: r.fields["Needs"] || [],
  }))
  .filter((i) => bucketIds.has(i.bucket))
  .sort((a, b) => a.bucket.localeCompare(b.bucket) || a.label.localeCompare(b.label));

// Only bump the timestamp when the pantry actually changed, so unchanged runs don't commit.
const body = { buckets, items };
let previous = null;
try { previous = JSON.parse(await readFile("pantry.json", "utf8")); } catch {}
const same = previous && JSON.stringify({ buckets: previous.buckets, items: previous.items }) === JSON.stringify(body);
const generated = same ? previous.generated : new Date().toISOString().replace(/\.\d+Z$/, "Z");

await writeFile("pantry.json", JSON.stringify({ generated, ...body }, null, 1) + "\n");
console.log(`${buckets.length} buckets, ${items.length} active ingredients${same ? " (no changes)" : ""}`);
