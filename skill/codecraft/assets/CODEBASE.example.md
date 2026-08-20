# CODEBASE.md — example shape

The canonical conventions file written by `init`. Copy this shape; keep it tight (read on every
command).

```markdown
# Stack & tooling
languages: <e.g. TypeScript 5.x, Go 1.22+>
formatter/linter: <prettier+eslint · gofmt+staticcheck>
build: <command> · test: <command> · types: <command>

# Conventions
naming: <camelCase files, PascalCase components, snake_case db>
structure: <feature modules; one export per file's public surface>
error model: <Result types in domain layer, exceptions at the edge>
async style: <async/await everywhere; no raw promises>

# Floor tunables (override .codecraft/config defaults)
max-function-lines: 30 · max-nesting: 3 · max-params: 4 · max-file-lines: 600
hard ceilings: <any team rules stricter than the skill's defaults>

# Vocabulary (domain terms and their canonical names)
<e.g. "settlement" = the post-payment reconciliation step; class: SettlementJob>

# Frozen zones
<layers/files that must not be modernized or restyled, with the reason>
```
