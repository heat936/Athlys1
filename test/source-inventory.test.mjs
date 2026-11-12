import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildSourceInventory } from "../src/source-inventory.mjs";

test("creates a six-repository CycloneDX source inventory with immutable tree hashes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "athlys-inventory-"));
  try {
    const manifest = [];
    for (let i = 1; i <= 6; i++) {
      const name = `Athlys${i}`;
      await mkdir(path.join(root, name), { recursive: true });
      await writeFile(path.join(root, name, "index.mjs"), `export const component = ${i};\n`);
      manifest.push({ repository: `heat936/${name}`, commitSha: String(i).repeat(40) });
    }
    const bom = await buildSourceInventory({ root, manifest, timestamp: "2026-11-12T12:00:00.000Z" });
    assert.equal(bom.bomFormat, "CycloneDX");
    assert.equal(bom.specVersion, "1.6");
    assert.equal(bom.components.length, 6);
    assert.ok(bom.components.every((component) => /^[a-f0-9]{64}$/.test(component.hashes[0].content)));
    assert.ok(bom.metadata.properties[0].value.includes("dependency completeness is not asserted"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects incomplete or duplicate repository manifests", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "athlys-inventory-"));
  try {
    await assert.rejects(buildSourceInventory({ root, manifest: [] }), /exactly six/);
    const duplicate = Array.from({ length: 6 }, () => ({ repository: "heat936/Athlys1", commitSha: "a".repeat(40) }));
    await assert.rejects(buildSourceInventory({ root, manifest: duplicate }), /duplicate repository/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
