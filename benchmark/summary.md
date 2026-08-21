# Suite benchmark — checker runs on public repositories

Generated 2026-08-21 · suite commit `8224af72` · re-run: `node scripts/benchmark.mjs --refresh`

Every facet checker runs with `--strict --json` against a shallow clone of each repo at the
recorded commit. `n/a` = the checker found no files of its types (recorded honestly, never as
clean). Mature, widely-used repos should score low on errors — the benchmark exists to prove
the checkers run, report, and stay honest on real code.

| Repository | Commit | crit | code | apic | dbcr | test | perf | secc | obsc | ship | bugc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| [expressjs/express](https://github.com/expressjs/express) | `a3714473` | **1**/w0 | **37**/w3252 | **5**/w70 | **1**/w0 | **3**/w6 | **0**/w8 | **3**/w40 | **0**/w18 | **0**/w3 | **1**/w2 |
| [psf/requests](https://github.com/psf/requests) | `8f8b212d` | **0**/w0 | **10**/w225 | **4**/w6 | **0**/w0 | **3**/w18 | **0**/w7 | **3**/w105 | **0**/w5 | **0**/w11 | **7**/w9 |
| [pallets/flask](https://github.com/pallets/flask) | `d318b683` | **0**/w0 | **21**/w684 | **35**/w21 | **0**/w8 | **5**/w0 | **0**/w6 | **1**/w26 | **0**/w36 | **0**/w3 | **25**/w1 |
| [fastify/fastify](https://github.com/fastify/fastify) | `83e69762` | **0**/w0 | **44**/w2856 | **38**/w43 | **0**/w0 | **86**/w599 | **23**/w21 | **1**/w81 | **0**/w117 | **1**/w5 | **2**/w1 |
| [lodash/lodash](https://github.com/lodash/lodash) | `a666ba59` | **0**/w1 | **78**/w5913 | **0**/w2 | **1**/w7 | **52**/w1 | **5**/w19 | **19**/w1 | **0**/w30 | **0**/w9 | **68**/w0 |
| [sindresorhus/ora](https://github.com/sindresorhus/ora) | `86403dcc` | **2**/w0 | **25**/w103 | **0**/w0 | **1**/w3 | **0**/w0 | **0**/w3 | **1**/w1 | **0**/w12 | **0**/w2 | **0**/w3 |

Cells are **errors**/warnings (checker exit 0/1 with `--strict`); full findings per rule in
`benchmark/results/*.json`.

Reading the results: errors are deterministic bans (debug markers, swallowed exceptions,
masks, secret echoes…). Some warning classes are deliberately heuristic and fire on
mature code (e.g. `magic-number`, `legacy-var`, URL mentions under `insecure-transport`) —
that over-approximation is documented per rule in each skill's anti-patterns reference, and
is why warnings never fail a run without `--strict`. The errors column is the signal; the
warnings column is the worklist.

