#!/usr/bin/env python3
"""Generate reverse-engineering-prompt.md from prompt.template.md.

Embeds the schema and the checker verbatim so the prompt is self-contained
and can never drift from the real files.

  python3 audit-system/prompt/build_prompt.py          # write the prompt
  python3 audit-system/prompt/build_prompt.py --check  # exit 1 if the prompt is stale
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA = os.path.join(HERE, "..", "schema", "project-audit.schema.json")
CHECKER = os.path.join(HERE, "..", "schema", "check_audit.py")
TEMPLATE = os.path.join(HERE, "prompt.template.md")
OUT = os.path.join(HERE, "reverse-engineering-prompt.md")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def build():
    text = read(TEMPLATE)
    for token, path in (("{{SCHEMA_JSON}}", SCHEMA), ("{{CHECKER_PY}}", CHECKER)):
        if token not in text:
            sys.exit(f"template is missing {token}")
        text = text.replace(token, read(path).rstrip("\n"))
    return text


def main():
    text = build()
    if "--check" in sys.argv:
        if not os.path.exists(OUT) or read(OUT) != text:
            print("reverse-engineering-prompt.md is stale: run python3 audit-system/prompt/build_prompt.py")
            return 1
        print("reverse-engineering-prompt.md is up to date")
        return 0
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {os.path.relpath(OUT)} ({len(text):,} chars)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
