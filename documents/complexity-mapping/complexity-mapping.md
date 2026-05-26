# Complexity Mapping

> Defines what each complexity level means for incoming solution requests.
> The `complexity` field in every intake form maps directly to these levels.

---

## Levels

| Form Value | Label | Definition |
|---|---|---|
| `Low Complexity` | **Low** | Standard configuration or minor customisation. Well-understood requirement, no new development needed. |
| `Medium Complexity` | **Medium** | Moderate effort — some custom logic, integration work, or multi-module involvement. Requires scoping before delivery. |
| `High Complexity` | **High** | Significant build, new integration, or cross-team dependency. Requires detailed discovery, architecture review, and phased delivery. |
| `Not Set` | **Unclassified** | Complexity not yet assessed. Consultant must review and assign a level before the solution is actioned. |

---

## How to Use

1. When a new form comes in, check the `complexity` field in the markdown frontmatter.
2. If `Not Set`, review the **Problem Description** and **Brief** sections and assign a level.
3. Use the level to estimate effort, assign the right consultant, and set client expectations.

---

## Notes on Form Data

The form occasionally uses inconsistent casing (`low Complexity`, `Low complexity`). These are all treated as `Low Complexity`. The `pull_forms.py` script preserves the raw value — normalisation happens at the workflow level.
