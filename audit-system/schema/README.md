# Project Audit Schema (schemaVersion 1)

This is the shared contract for the audit system:

- **Field Manual** (`audit-system/field-manual/`): imports and exports this format.
- **Reverse-Engineering Prompt** (`audit-system/prompt/`): embeds this schema and tells the agent to output it.
- **Audit runs** (`audit-system/audits/`): each one is a single JSON file in this format.

| File | Purpose |
|---|---|
| `project-audit.schema.json` | JSON Schema (draft 2020-12). Validates structure. |
| `example.lendloop.audit.json` | A complete, valid example (fictional LendLoop project, the Field Manual's worked example). |

## Shape

```
{
  schemaVersion: 1,
  project: { name, repoUrl, commit?, stack, framework, keyLibraries[], auditDate, auditedBy?, notes? },
  tools: {
    figjam | eraser | bruno | figma | prisma | plane | codeSentry: {
      status, equivalentTool?, planned[], built[], gaps[], artifacts[], evidence[], notes
    }
  },
  topGaps?: [gapId, ...]
}

finding  = { text, evidence?: [path], inferred?: bool }
gap      = { id, text, impact: high|medium|low, evidence?, inferred?, ticketRef? }
artifact = { name, format, filename?, content }
```

`?` = optional. Every other field is required, even when empty (`[]` or `""`).

## Rules the JSON Schema cannot enforce

Importers (the Field Manual) and agents must check these as well:

1. **Status decision rule** for each tool:
   - `planned` is empty → `Not planned`
   - `planned` is non-empty and `built` is empty → `Missing`
   - both are non-empty and at least one gap is `high` or `medium` → `Partial`
   - both are non-empty and no gap is `high` or `medium` → `Matches`
2. **Gap ids** use the step prefix of the tool they belong to (`bruno` → `GAP-BRUNO-NN`, `codeSentry` → `GAP-CODE-NN`). They are unique across the file and never renumbered.
3. **`topGaps`** may only list ids that exist in some `tools.*.gaps`.
4. **Planned vs built evidence:** `planned` cites README, docs, TODO/FIXME, issues, and commits. `built` cites code, config, tests, and migrations.
5. **No invention:** every finding without a direct citation must have `"inferred": true`.

## Extending

- Custom fields go in `x-` keys (for example `"x-estimateHours": 3`) at the top level, on `project`, or on a tool. Validators allow them, and importers keep them.
- A breaking change (renaming, removing, or retyping a field, or changing an enum) bumps `schemaVersion` to 2 and needs a migration function in the Field Manual. Adding an optional field does not bump the version.

## Validate

```bash
npx ajv-cli@5 validate --spec=draft2020 -s audit-system/schema/project-audit.schema.json -d path/to/audit.json
```

Or in Python:

```bash
python3 -c "import json,jsonschema; jsonschema.validate(json.load(open('audit.json')), json.load(open('audit-system/schema/project-audit.schema.json')))"
```
