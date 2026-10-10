# Project skills

Claude Code loads each folder here that holds a `SKILL.md`. Skill content is adapted from upstream repos, with the upstream licence saved beside each skill as `LICENSE.txt`. To update a skill, copy it again from the source below.

| Skill | Source | Licence |
| --- | --- | --- |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) `skills/caveman`, commit `2e08b91` | Apache 2.0 |
| `advanced-evaluation`, `bdi-mental-states`, `context-compression`, `context-degradation`, `context-fundamentals`, `context-optimization`, `evaluation`, `filesystem-context`, `harness-engineering`, `hosted-agents`, `latent-briefing`, `long-horizon-prompting`, `memory-systems`, `multi-agent-patterns`, `project-development`, `self-improvement-loops`, `self-managed-context`, `tool-design` | [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) `skills/`, commit `58b55a8` | MIT |

Notes:

- `caveman` is turned on with `/caveman` or "caveman mode" and stays on until "stop caveman" or "normal mode". `/caveman ultra` and `/caveman wenyan` also activate the local caveman mode.
- The Python files under each skill's `scripts/` folder are standard-library examples. Nothing runs them automatically.
- `caveman` also retains its upstream `NOTICE` and `LICENSE-MIT` beside `LICENSE.txt`.
