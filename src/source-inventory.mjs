import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const EXCLUDED = new Set([".git", "node_modules", "coverage", "dist", "evidence"]);

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory() && EXCLUDED.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

export async function buildSourceInventory({ root, manifest, timestamp = new Date().toISOString() }) {
  if (!Array.isArray(manifest) || manifest.length !== 6) throw new TypeError("manifest must contain exactly six repository revisions");
  const seen = new Set();
  const components = [];
  for (const item of [...manifest].sort((a, b) => a.repository.localeCompare(b.repository))) {
    if (!/^heat936\/Athlys[1-6]$/.test(item.repository) || !/^[a-f0-9]{40}$/.test(item.commitSha)) {
      throw new TypeError("repository identity or immutable commit SHA is invalid");
    }
    if (seen.has(item.repository)) throw new TypeError("duplicate repository in manifest");
    seen.add(item.repository);
    const repoName = item.repository.split("/")[1];
    const repoRoot = path.join(root, repoName);
    const files = await listFiles(repoRoot);
    if (files.length === 0) throw new TypeError(`source tree is empty: ${repoName}`);
    const entries = [];
    for (const file of files) {
      const relative = path.relative(repoRoot, file).split(path.sep).join("/");
      entries.push({ path: relative, digest: sha256(await readFile(file)) });
    }
    entries.sort((a, b) => a.path.localeCompare(b.path));
    const treeDigest = sha256(entries.map((entry) => `${entry.path}\0${entry.digest}\n`).join(""));
    components.push({
      type: "application",
      name: repoName,
      version: item.commitSha,
      hashes: [{ alg: "SHA-256", content: treeDigest }],
      properties: [
        { name: "athlys:repository", value: item.repository },
        { name: "athlys:commit", value: item.commitSha },
        { name: "athlys:inventory-kind", value: "source-tree-snapshot" },
        { name: "athlys:source-file-count", value: String(entries.length) }
      ]
    });
  }
  if (seen.size !== 6) throw new TypeError("all six allowlisted repositories are required");
  const serial = sha256(components.map((c) => `${c.name}:${c.version}:${c.hashes[0].content}`).join("\n")).slice(0, 32);
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    serialNumber: `urn:uuid:${serial.slice(0,8)}-${serial.slice(8,12)}-4${serial.slice(13,16)}-a${serial.slice(17,20)}-${serial.slice(20,32)}`,
    version: 1,
    metadata: {
      timestamp,
      tools: { components: [{ type: "application", name: "athlys-source-inventory", version: "1.0.0" }] },
      component: { type: "application", name: "athlys-six-repository-source-inventory", version: "1.0.0" },
      properties: [{ name: "athlys:scope", value: "source-tree-inventory-only; dependency completeness is not asserted" }]
    },
    components
  };
}

async function main() {
  const args = process.argv.slice(2);
  const value = (name) => {
    const index = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const root = value("--root");
  const manifestPath = value("--manifest");
  const output = value("--output");
  if (!root || !manifestPath || !output) throw new Error("usage: node src/source-inventory.mjs --root DIR --manifest FILE --output FILE");
  const manifest = (await readFile(manifestPath, "utf8")).trim().split(/\r?\n/).map((line) => {
    const [repository, commitSha] = line.trim().split(/\s+/);
    return { repository: `heat936/${repository}`, commitSha };
  });
  const bom = await buildSourceInventory({ root, manifest });
  await writeFile(output, JSON.stringify(bom, null, 2) + "\n");
  process.stdout.write(`Wrote CycloneDX source inventory with ${bom.components.length} repository components. This is not a dependency-complete SBOM.\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
