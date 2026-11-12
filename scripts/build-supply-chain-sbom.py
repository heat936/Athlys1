#!/usr/bin/env python3
"""Build a privacy-sanitized CycloneDX 1.6 SBOM for the Athlys CI source bundle."""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import hashlib
import json
import re
import uuid
from pathlib import Path
from urllib.parse import quote


COMPONENT_MAP = {
    "heat936/Athlys1": "component-01",
    "heat936/Athlys2": "component-02",
    "heat936/Athlys3": "component-03",
    "heat936/Athlys4": "component-04",
    "heat936/Athlys5": "component-05",
    "heat936/Athlys6": "component-06",
}
PRIVATE_PATHS = {
    f"components/Athlys{i}": f"components/component-{i:02d}"
    for i in range(1, 7)
}
PRIVATE_NAMES = {f"Athlys{i}": f"component-{i:02d}" for i in range(1, 7)}


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def scrub(value):
    if isinstance(value, str):
        for old, new in PRIVATE_PATHS.items():
            value = value.replace(old, new)
        for old, new in PRIVATE_NAMES.items():
            value = re.sub(rf"\b{old}\b", new, value)
        value = re.sub(r"heat936/Athlys[1-6]", "athlys-internal-component", value)
        value = re.sub(r"\b[0-9a-f]{40}\b", "[redacted-revision]", value)
        return value
    if isinstance(value, list):
        return [scrub(item) for item in value]
    if isinstance(value, dict):
        return {scrub(k): scrub(v) for k, v in value.items()}
    return value


def add_component(components: dict, component: dict) -> None:
    ref = component.get("bom-ref")
    if not ref:
        canonical = json.dumps(component, sort_keys=True, separators=(",", ":"))
        ref = "urn:athlys:component:" + hashlib.sha256(canonical.encode()).hexdigest()
        component["bom-ref"] = ref
    components.setdefault(ref, component)


def purl_name(value: str) -> str:
    return quote(value.strip().lower(), safe="@._+-")


def parse_freeze(path: Path) -> list[tuple[str, str]]:
    if not path.exists():
        return []
    packages = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-e ") or " @ " in line:
            continue
        match = re.match(r"^([A-Za-z0-9_.-]+)==([^\s;]+)$", line)
        if match:
            packages.append((match.group(1), match.group(2)))
    return packages


def parse_dpkg(path: Path) -> list[tuple[str, str, str]]:
    if not path.exists():
        return []
    packages = []
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split("\t")
        if len(parts) < 2 or not parts[0] or not parts[1]:
            continue
        raw_name, version = parts[0].strip(), parts[1].strip()
        if ":" in raw_name:
            name, arch = raw_name.rsplit(":", 1)
        else:
            name, arch = raw_name, "all"
        packages.append((name, version, arch))
    return packages


def source_components(source_bom: dict) -> list[dict]:
    result = []
    for component in source_bom.get("components", []):
        component = copy.deepcopy(component)
        original_repo = next(
            (p.get("value") for p in component.get("properties", [])
             if p.get("name") == "athlys:repository"),
            None,
        )
        component_id = COMPONENT_MAP.get(original_repo)
        if not component_id:
            raise ValueError("Unexpected source component; refusing to publish an unidentified source snapshot")
        component["name"] = component_id
        component["version"] = "source-snapshot"
        component["bom-ref"] = f"urn:athlys:source:{component_id}"
        properties = [
            p for p in component.get("properties", [])
            if p.get("name") not in {"athlys:repository", "athlys:commit"}
        ]
        properties.append({"name": "athlys:component-id", "value": component_id})
        properties.append({"name": "athlys:source-identity", "value": "redacted"})
        component["properties"] = properties
        result.append(component)
    if len(result) != 6:
        raise ValueError(f"Expected six source components, found {len(result)}")
    return result


def load_syft_components(paths: list[Path]) -> tuple[list[dict], list[dict]]:
    components, dependencies = [], []
    for path in paths:
        if not path.exists():
            continue
        bom = load_json(path)
        components.extend(scrub(copy.deepcopy(bom.get("components", []))))
        dependencies.extend(scrub(copy.deepcopy(bom.get("dependencies", []))))
    return components, dependencies


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-inventory", type=Path, required=True)
    parser.add_argument("--syft-source", type=Path, required=True)
    parser.add_argument("--syft-tools", type=Path, required=True)
    parser.add_argument("--dpkg", type=Path, required=True)
    parser.add_argument("--python-freeze", type=Path, required=True)
    parser.add_argument("--build-metadata", type=Path, required=True)
    parser.add_argument("--private-commits", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    source_bom = load_json(args.source_inventory)
    metadata = load_json(args.build_metadata)
    components: dict[str, dict] = {}
    dependencies: dict[str, set[str]] = {}

    root_ref = "urn:athlys:ci-supply-chain:root"
    root = {
        "type": "application",
        "bom-ref": root_ref,
        "name": "athlys-ci-source-bundle",
        "version": "1.0.0",
        "description": "Sanitized inventory of the six-component Athlys CI source bundle and its detected build-time dependencies.",
    }
    for component in source_components(source_bom):
        add_component(components, component)
        dependencies.setdefault(root_ref, set()).add(component["bom-ref"])

    syft_components, syft_dependencies = load_syft_components(
        [args.syft_source, args.syft_tools]
    )
    for component in syft_components:
        if not isinstance(component, dict):
            continue
        component = scrub(component)
        if component.get("name") in PRIVATE_NAMES:
            component["name"] = PRIVATE_NAMES[component["name"]]
        add_component(components, component)

    for dep in syft_dependencies:
        ref = dep.get("ref")
        if not ref:
            continue
        dependencies.setdefault(ref, set()).update(dep.get("dependsOn", []))

    for action in metadata.get("actions", []):
        name = action["name"]
        sha = action["commit"]
        version = action["version"]
        ref = f"urn:athlys:action:{name}:{sha}"
        add_component(components, {
            "type": "application",
            "bom-ref": ref,
            "name": name,
            "version": version,
            "purl": f"pkg:github/{name}@{version}",
            "properties": [
                {"name": "athlys:git-commit", "value": sha},
                {"name": "athlys:source-archive-sha256", "value": action["source_archive_sha256"]},
                {"name": "athlys:action-runtime", "value": action.get("runtime", "unknown")},
            ],
        })
        dependencies.setdefault(root_ref, set()).add(ref)

    for tool in metadata.get("tools", []):
        ref = f"urn:athlys:tool:{tool['id']}"
        component = {
            "type": "application",
            "bom-ref": ref,
            "name": tool["name"],
            "version": tool["version"],
            "properties": [
                {"name": "athlys:inventory-source", "value": "runtime-observation"},
            ],
        }
        if tool.get("purl"):
            component["purl"] = tool["purl"]
        if tool.get("sha256"):
            component["hashes"] = [{"alg": "SHA-256", "content": tool["sha256"]}]
        if tool.get("source_commit"):
            component["properties"].append(
                {"name": "athlys:source-commit", "value": tool["source_commit"]}
            )
        add_component(components, component)
        dependencies.setdefault(root_ref, set()).add(ref)

    runner = metadata.get("runner", {})
    runner_ref = "urn:athlys:runner:github-hosted-ubuntu"
    add_component(components, {
        "type": "operating-system",
        "bom-ref": runner_ref,
        "name": runner.get("name", "Ubuntu 24.04 GitHub-hosted runner"),
        "version": runner.get("version", "unknown"),
        "properties": [
            {"name": "athlys:runner-image", "value": runner.get("image", "unknown")},
            {"name": "athlys:kernel", "value": runner.get("kernel", "unknown")},
        ],
    })
    dependencies.setdefault(root_ref, set()).add(runner_ref)

    for name, version, arch in parse_dpkg(args.dpkg):
        ref = f"pkg:deb/ubuntu/{purl_name(name)}@{quote(version, safe='._+-')}?arch={quote(arch, safe='._+-')}"
        add_component(components, {
            "type": "library",
            "bom-ref": ref,
            "name": name,
            "version": version,
            "purl": ref,
            "scope": "required",
            "properties": [
                {"name": "athlys:inventory-source", "value": "dpkg-query"},
                {"name": "athlys:runner-architecture", "value": arch},
            ],
        })
        dependencies.setdefault(root_ref, set()).add(ref)

    for name, version in parse_freeze(args.python_freeze):
        ref = f"pkg:pypi/{purl_name(name)}@{quote(version, safe='._+-')}"
        add_component(components, {
            "type": "library",
            "bom-ref": ref,
            "name": name,
            "version": version,
            "purl": ref,
            "scope": "required",
            "properties": [
                {"name": "athlys:inventory-source", "value": "uv-pip-freeze"},
                {"name": "athlys:environment", "value": "Spec Kit CLI isolated environment"},
            ],
        })
        dependencies.setdefault(root_ref, set()).add(ref)

    # Drop dependency edges to components that the merged BOM does not contain.
    private_commits = {line.split()[1] for line in args.private_commits.read_text(encoding="utf-8").splitlines() if len(line.split()) == 2 and re.fullmatch(r"[0-9a-f]{40}", line.split()[1])}
    known = set(components) | {root_ref}
    normalized_dependencies = []
    for ref, targets in sorted(dependencies.items()):
        if ref not in known:
            continue
        normalized_dependencies.append({
            "ref": ref,
            "dependsOn": sorted(target for target in targets if target in known and target != ref),
        })

    source_meta = source_bom.get("metadata", {})
    tool_components = source_meta.get("tools", {}).get("components", [])
    tool_components = copy.deepcopy(tool_components)
    tool_components.append({
        "type": "application",
        "name": "Syft",
        "version": metadata.get("syft_version", "1.57.1"),
        "purl": "pkg:generic/syft@" + metadata.get("syft_version", "1.57.1"),
    })

    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": "urn:uuid:" + str(uuid.uuid4()),
        "version": 1,
        "metadata": {
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
            "tools": {"components": tool_components},
            "component": {
                "type": "application",
                "bom-ref": root_ref,
                "name": "athlys-ci-source-bundle",
                "version": "1.0.0",
            },
            "properties": [
                {"name": "athlys:scope", "value": "six source snapshots; detected package manifests and lockfiles; pinned CI actions; Spec Kit runtime dependencies; Ubuntu dpkg inventory"},
                {"name": "athlys:privacy", "value": "private repository identifiers, commit IDs, and source paths redacted"},
                {"name": "athlys:completeness", "value": "incomplete by design: no production binary/container is built; undetected bundled dependencies and mutable hosted-runner internals may remain"},
                {"name": "athlys:source-archive-uploaded", "value": "false"},
                {"name": "athlys:source-archive-sha256", "value": metadata.get("source_archive_sha256", "not-recorded")},
            ],
        },
        "components": sorted(components.values(), key=lambda item: item.get("bom-ref", "")),
        "dependencies": normalized_dependencies,
        "compositions": [{
            "aggregate": "incomplete",
            "description": "The SBOM captures all package metadata detectable from scanned source/lockfiles and observed build environments; it is not a complete binary/release SBOM.",
        }],
    }

    # Final privacy guard: no private repository identity or 40-character revision may escape.
    serialized = json.dumps(bom, ensure_ascii=False, sort_keys=True)
    if re.search(r"heat936/Athlys[1-6]|\bAthlys[1-6]\b|\b[0-9a-f]{40}\b", serialized):
        raise ValueError("Privacy guard failed: private repository identifier or commit SHA found in public SBOM")
    if len({c.get("bom-ref") for c in bom["components"]}) != len(bom["components"]):
        raise ValueError("Duplicate bom-ref values")
    bom_refs = {c.get("bom-ref") for c in bom["components"]}
    for dep in bom["dependencies"]:
        if dep["ref"] not in bom_refs or any(target not in bom_refs for target in dep["dependsOn"]):
            raise ValueError("Unresolved dependency reference")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(bom, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote CycloneDX 1.6 SBOM with {len(bom['components'])} components and {len(bom['dependencies'])} dependency records")


if __name__ == "__main__":
    main()
