import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import importlib.util

module_path = Path(__file__).resolve().parents[1] / "scripts" / "build-supply-chain-sbom.py"
module_spec = importlib.util.spec_from_file_location("build_supply_chain_sbom", module_path)
sbom = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(sbom)
import sys


class SupplyChainSbomTests(unittest.TestCase):
    def test_source_components_redact_private_repo_and_commit(self):
        private_sha = "a" * 40
        source = {
            "components": [{
                "type": "application",
                "name": "Athlys3",
                "version": private_sha,
                "hashes": [{"alg": "SHA-256", "content": "b" * 64}],
                "properties": [
                    {"name": "athlys:repository", "value": "heat936/Athlys3"},
                    {"name": "athlys:commit", "value": private_sha},
                    {"name": "athlys:source-file-count", "value": "9"},
                ],
            }] + [{
                "type": "application",
                "name": f"Athlys{i}",
                "version": "c" * 40,
                "hashes": [{"alg": "SHA-256", "content": "d" * 64}],
                "properties": [
                    {"name": "athlys:repository", "value": f"heat936/Athlys{i}"},
                    {"name": "athlys:commit", "value": "c" * 40},
                ],
            } for i in [1, 2, 4, 5, 6]],
        }
        result = sbom.source_components(source)
        serialized = json.dumps(result)
        self.assertEqual(len(result), 6)
        self.assertIn("component-03", serialized)
        self.assertNotIn("heat936/Athlys", serialized)
        self.assertNotIn(private_sha, serialized)
        self.assertNotIn('"athlys:commit"', serialized)

    def test_build_merges_packages_and_redacts_private_source_identity(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = {"metadata": {"tools": {"components": []}}, "components": []}
            private_lines = []
            for i in range(1, 7):
                sha = f"{i:040x}"
                source["components"].append({
                    "type": "application",
                    "name": f"Athlys{i}",
                    "version": sha,
                    "hashes": [{"alg": "SHA-256", "content": hashlib.sha256(f"source-{i}".encode()).hexdigest()}],
                    "properties": [
                        {"name": "athlys:repository", "value": f"heat936/Athlys{i}"},
                        {"name": "athlys:commit", "value": sha},
                        {"name": "athlys:source-file-count", "value": "9"},
                    ],
                })
                private_lines.append(f"Athlys{i} {sha}")
            (root / "source.json").write_text(json.dumps(source), encoding="utf-8")
            (root / "private.txt").write_text("\n".join(private_lines), encoding="utf-8")
            syft_source = {
                "components": [{
                    "type": "library",
                    "bom-ref": "pkg:npm/example@1.2.3",
                    "name": "example",
                    "version": "1.2.3",
                    "purl": "pkg:npm/example@1.2.3",
                }],
                "dependencies": [{"ref": "pkg:npm/example@1.2.3", "dependsOn": []}],
            }
            (root / "syft-source.json").write_text(json.dumps(syft_source), encoding="utf-8")
            (root / "syft-tools.json").write_text(json.dumps({"components": [], "dependencies": []}), encoding="utf-8")
            (root / "dpkg.tsv").write_text("libc6:amd64\t2.39\t\n", encoding="utf-8")
            (root / "freeze.txt").write_text("typer==0.24.0\n", encoding="utf-8")
            metadata = {
                "syft_version": "1.57.1",
                "source_archive_sha256": "e" * 64,
                "actions": [{
                    "name": "actions/checkout",
                    "version": "v7.0.1",
                    "commit": "f" * 40,
                    "source_archive_sha256": "1" * 64,
                    "runtime": "node24",
                }],
                "tools": [{"id": "node", "name": "Node.js", "version": "v22.1.0"}],
                "runner": {"name": "Ubuntu 24.04", "version": "24.04", "image": "ubuntu24/2026.11", "kernel": "6.x"},
            }
            (root / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")
            output = root / "public" / "sbom.json"
            argv = [
                "build-supply-chain-sbom.py",
                "--source-inventory", str(root / "source.json"),
                "--syft-source", str(root / "syft-source.json"),
                "--syft-tools", str(root / "syft-tools.json"),
                "--dpkg", str(root / "dpkg.tsv"),
                "--python-freeze", str(root / "freeze.txt"),
                "--build-metadata", str(root / "metadata.json"),
                "--private-commits", str(root / "private.txt"),
                "--output", str(output),
            ]
            with patch.object(sys, "argv", argv):
                sbom.main()
            result = json.loads(output.read_text(encoding="utf-8"))
            serialized = json.dumps(result)
            self.assertEqual(result["specVersion"], "1.6")
            self.assertEqual(len([c for c in result["components"] if c["name"].startswith("component-")]), 6)
            self.assertIn("pkg:npm/example@1.2.3", serialized)
            self.assertIn("pkg:deb/ubuntu/libc6@2.39?arch=amd64", serialized)
            self.assertIn("pkg:pypi/typer@0.24.0", serialized)
            self.assertIn("actions/checkout", serialized)
            self.assertNotIn("heat936/Athlys", serialized)
            for line in private_lines:
                self.assertNotIn(line.split()[1], serialized)
            self.assertEqual(result["compositions"][0]["aggregate"], "incomplete")
            refs = {c["bom-ref"] for c in result["components"]}
            refs.add(result["metadata"]["component"]["bom-ref"])
            for dependency in result["dependencies"]:
                self.assertIn(dependency["ref"], refs)
                self.assertTrue(set(dependency["dependsOn"]).issubset(refs))


if __name__ == "__main__":
    unittest.main()
