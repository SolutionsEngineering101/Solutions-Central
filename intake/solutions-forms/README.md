# Solutions Form — Intake Template

> This file is the schema for all incoming solution requests.
> Power Automate writes responses here in this format.
> Claude reads this when running "process new solution form".

---

## Schema (YAML frontmatter)

```yaml
---
form_id: ""
submitted_at: ""
submitted_by: ""
client_name: ""
client_industry: ""
problem_statement: ""
requirements: []
constraints: []
timeline: ""
budget_range: ""
priority: low | medium | high | critical
attachments: []
status: new | in-progress | finalized | recorded
---
```

## Example Entry

```yaml
---
form_id: "SF-001"
submitted_at: "2026-05-13T10:00:00"
submitted_by: "Hemanga Bharadwaj"
client_name: "Acme Corp"
client_industry: "Retail"
problem_statement: "Client needs automated invoice reconciliation integrated with their ERP"
requirements:
  - SAP integration
  - Real-time sync
  - Audit trail
constraints:
  - Must go live within 6 weeks
  - No changes to existing ERP schema
timeline: "6 weeks"
budget_range: "medium"
priority: high
attachments: []
status: new
---
```
