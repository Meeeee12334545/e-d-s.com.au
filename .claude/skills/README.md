# Project skills

Claude Code loads each folder here that holds a `SKILL.md`. The files are copied unchanged from their upstream repos, with the upstream licence saved beside each skill as `LICENSE.txt`. To update a skill, copy it again from the source below.

| Skill | Source | Licence |
| --- | --- | --- |
| `caveman` | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) `skills/caveman`, commit `2e08b91` | Apache 2.0 |
| `advanced-evaluation`, `bdi-mental-states`, `context-compression`, `context-degradation`, `context-fundamentals`, `context-optimization`, `evaluation`, `filesystem-context`, `harness-engineering`, `hosted-agents`, `latent-briefing`, `long-horizon-prompting`, `memory-systems`, `multi-agent-patterns`, `project-development`, `self-improvement-loops`, `self-managed-context`, `tool-design` | [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) `skills/`, commit `58b55a8` | MIT |

`asset-exploded-view` is written for this repo, not copied: how to take a district or an asset of the home page city apart, with its parts named from the datasheets. Its method (one explosion axis, even spacing, real parts only, a layered peel for systems) adapts the image-generation skill of the same name in [JoshuaShepherd/my-skills](https://github.com/JoshuaShepherd/my-skills), and its motion and critique steps draw on [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) and [owl-listener/designer-skills](https://github.com/owl-listener/designer-skills).

Notes:

- `caveman` is turned on with `/caveman` or "caveman mode" and stays on until "stop caveman" or "normal mode". It mentions `ultracave` and `megacave` variants, which live in the caveman repo and are not copied here.
- `harness-engineering` refers to `researcher/` files that live in the upstream repo, not here.
- The Python files under each skill's `scripts/` folder are standard-library examples. Nothing runs them automatically.
