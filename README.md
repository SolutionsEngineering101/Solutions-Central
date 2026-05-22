# Solutions Engineering — Central Repository

> Powered by Claude Code. All workflows are run from the terminal.

## Team
| Name | Folder |
|---|---|
| Hemanga Bharadwaj | `team/hemanga-bharadwaj/` |
| Pankaj Chakrabarty | `team/pankaj-chakrabarty/` |
| Bhargav Nath | `team/bhargav-nath/` |
| Nilimpa Nizara Bora | `team/nilimpa-nizara-bora/` |
| Garima Kayal | `team/garima-kayal/` |
| Kongkana Bayan | `team/kongkana-bayan/` |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/[org]/solutions-engineering.git
cd solutions-engineering

# Run a workflow
claude "process new solution form"
claude "log today's work for [your name]"
claude "create new project [project name] for [your name]"
```

## Repository Structure

```
solutions-engineering/
├── intake/                      # All incoming data lands here
│   └── solutions-forms/         # MS Forms responses (auto-pulled via Graph API)
├── documents/                   # Central document library
├── product-information/         # Product specs, screenshots, release notes
├── playbook/                    # Recorded best practices and learnings
├── pre-built-solutions/         # Reusable solution blueprints
├── skills/                      # Team skills library
├── project-management/          # Backlog, sprints, resources
├── dashboard-data/              # JSON data powering the web dashboard
├── team/                        # Personal folders (one per member)
│   ├── _template/               # Copy this when onboarding new member
│   └── [member-name]/
│       ├── worklog/             # Daily logs
│       └── projects/            # Per-project folders
└── scripts/                     # Claude Code workflow scripts
```

## Workflows (run via Claude Code terminal)

| Command | What it does |
|---|---|
| `claude "process new solution form"` | Reads latest intake, generates solution skeleton |
| `claude "log today's work for [name]"` | Creates/updates daily worklog |
| `claude "create new project [name] for [member]"` | Scaffolds a new project folder |
| `claude "run CLAUDE.md workflow: solutions"` | Full solutions flow with playbook/blueprint prompts |

## Onboarding a New Team Member

```bash
cp -r team/_template team/[new-member-name]
git add team/[new-member-name]
git commit -m "onboard: add folder for [new member name]"
git push
```
