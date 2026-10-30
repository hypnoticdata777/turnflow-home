#!/usr/bin/env python3
"""Check a project audit JSON (schemaVersion 1).

Three layers:
  1. Structure: JSON Schema validation (needs `pip install jsonschema`; skipped with a warning if missing).
  2. Rules the schema cannot express: status decision rule, gap id prefixes and uniqueness,
     topGaps integrity, uncited claims.
  3. Evidence (only with --repo): every cited path exists, line numbers are in range,
     `missing:` paths really are missing, `commit:` SHAs exist.

Usage:
  python3 check_audit.py audit.json
  python3 check_audit.py audit.json --repo /path/to/repo --schema project-audit.schema.json

Exit code 1 if any error. Warnings never fail the check.
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = [("figjam", "FIGJAM"), ("eraser", "ERASER"), ("bruno", "BRUNO"), ("figma", "FIGMA"),
         ("prisma", "PRISMA"), ("plane", "PLANE"), ("codeSentry", "CODE")]
IMPACT_ORDER = {"high": 0, "medium": 1, "low": 2}
# Evidence prefixes that are not repo paths (checked differently or not at all).
NON_PATH = ("search:", "cmd:", "url:", "issue:", "pr:", "commit:", "missing:", "http://", "https://")
LINE_SUFFIX = re.compile(r"^(.*?):(\d+)(?:-(\d+))?$")


def rule_status(t):
    if not t.get("planned"):
        return "Not planned"
    if not t.get("built"):
        return "Missing"
    if any(g.get("impact") in ("high", "medium") for g in t.get("gaps", [])):
        return "Partial"
    return "Matches"


def check_structure(doc, schema_path, errors, warnings):
    if not os.path.exists(schema_path):
        warnings.append(f"schema file not found at {schema_path}: structural validation skipped")
        return
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        warnings.append("jsonschema not installed (pip install jsonschema): structural validation skipped")
        return
    with open(schema_path) as f:
        schema = json.load(f)
    for e in sorted(Draft202012Validator(schema).iter_errors(doc), key=lambda e: list(e.path)):
        loc = ".".join(str(p) for p in e.path) or "(root)"
        errors.append(f"schema: {loc}: {e.message}")


def check_rules(doc, errors, warnings):
    tools = doc.get("tools") if isinstance(doc.get("tools"), dict) else {}
    seen = {}
    for key, prefix in TOOLS:
        t = tools.get(key)
        if not isinstance(t, dict):
            continue
        for g in t.get("gaps", []) if isinstance(t.get("gaps"), list) else []:
            gid = g.get("id", "") if isinstance(g, dict) else ""
            if not gid.startswith(f"GAP-{prefix}-"):
                errors.append(f"rule: tools.{key}: gap id {gid!r} must start with GAP-{prefix}-")
            if gid in seen:
                errors.append(f"rule: duplicate gap id {gid} (in {seen[gid]} and {key})")
            seen[gid] = key
        try:
            want = rule_status(t)
        except (AttributeError, TypeError):
            continue
        if t.get("status") != want:
            errors.append(f"rule: tools.{key}.status is {t.get('status')!r}, status rule gives {want!r}")
        for field in ("planned", "built"):
            for i, f in enumerate(t.get(field, []) if isinstance(t.get(field), list) else []):
                if isinstance(f, dict) and not f.get("evidence") and not f.get("inferred"):
                    warnings.append(f"rule: tools.{key}.{field}[{i}] has no evidence and is not marked inferred: {f.get('text', '')[:70]!r}")
        for i, g in enumerate(t.get("gaps", []) if isinstance(t.get("gaps"), list) else []):
            if isinstance(g, dict) and not g.get("evidence") and not g.get("inferred"):
                warnings.append(f"rule: tools.{key}.gaps[{i}] ({g.get('id')}) has no evidence and is not marked inferred")
    top = doc.get("topGaps")
    if top is None:
        if seen:
            warnings.append("rule: topGaps is missing; the agent prompt requires it")
    elif isinstance(top, list):
        for gid in top:
            if gid not in seen:
                errors.append(f"rule: topGaps lists {gid!r}, which is not in any tool's gaps")
        missing = [g for g in seen if g not in top]
        if missing:
            warnings.append(f"rule: topGaps does not rank {len(missing)} gap(s): {', '.join(sorted(missing))}")


def iter_evidence(doc):
    for key, _ in TOOLS:
        t = doc.get("tools", {}).get(key)
        if not isinstance(t, dict):
            continue
        for e in t.get("evidence", []):
            yield f"tools.{key}.evidence", e
        for field in ("planned", "built", "gaps"):
            for i, item in enumerate(t.get(field, [])):
                if isinstance(item, dict):
                    for e in item.get("evidence", []):
                        yield f"tools.{key}.{field}[{i}]", e


def check_evidence(doc, repo, errors, warnings):
    cache = {}
    for where, ev in iter_evidence(doc):
        if not isinstance(ev, str) or not ev.strip():
            continue
        ev = ev.strip()
        if ev.startswith("missing:"):
            target = ev[len("missing:"):].strip()
            if glob.glob(os.path.join(repo, target), recursive=True):
                errors.append(f"evidence: {where}: {ev!r} is marked missing but exists in the repo")
            continue
        if ev.startswith("commit:"):
            sha = ev[len("commit:"):].strip()
            ok = subprocess.run(["git", "-C", repo, "cat-file", "-e", f"{sha}^{{commit}}"],
                                capture_output=True).returncode == 0
            if not ok:
                errors.append(f"evidence: {where}: commit {sha} not found in {repo}")
            continue
        if ev.startswith(NON_PATH):
            continue
        path, start, end = ev, None, None
        m = LINE_SUFFIX.match(ev)
        if m:
            path, start, end = m.group(1), int(m.group(2)), int(m.group(3) or m.group(2))
        full = os.path.join(repo, path)
        matches = glob.glob(full, recursive=True) if any(c in path for c in "*?[") else ([full] if os.path.exists(full) else [])
        if not matches:
            errors.append(f"evidence: {where}: path not found: {path}")
            continue
        if start is not None and os.path.isfile(matches[0]):
            if matches[0] not in cache:
                with open(matches[0], errors="replace") as f:
                    cache[matches[0]] = sum(1 for _ in f)
            n = cache[matches[0]]
            if start < 1 or end > n or end < start:
                errors.append(f"evidence: {where}: {ev} is outside the file ({n} lines)")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("audit", help="path to the audit JSON")
    ap.add_argument("--schema", default=os.path.join(here, "project-audit.schema.json"))
    ap.add_argument("--repo", help="repo root; enables evidence checks")
    args = ap.parse_args()

    try:
        with open(args.audit) as f:
            doc = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print(f"ERROR: cannot read JSON: {e}")
        return 1
    if not isinstance(doc, dict):
        print("ERROR: root must be a JSON object")
        return 1

    errors, warnings = [], []
    check_structure(doc, args.schema, errors, warnings)
    check_rules(doc, errors, warnings)
    if args.repo:
        check_evidence(doc, args.repo, errors, warnings)
    else:
        warnings.append("no --repo given: evidence paths not checked")

    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    gaps = sum(len(doc.get("tools", {}).get(k, {}).get("gaps", [])) for k, _ in TOOLS)
    print(f"\n{len(errors)} error(s), {len(warnings)} warning(s), {gaps} gap(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
