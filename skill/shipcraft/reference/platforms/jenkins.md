# Platform sheet: Jenkins

Loaded with `domains/pipelines.md`, `domains/gates.md`, `domains/config.md` when the work is a
Jenkins pipeline. The domains say *what* the pipeline must be; this sheet says *how* to get
there in Jenkins — where the platform's flexibility is the biggest footgun.

## The instruments

| Question | Instrument |
|---|---|
| Is the pipeline in the repo? | **Jenkinsfile-as-code** (Declarative) in the repo, driven by Multibranch — a UI-configured job is an unowned gate (`domains/gates.md`) |
| Are the shared steps owned? | A shared pipeline library **pinned by ref/tag**, not `@master` — the library is code, version it like code |
| Can anyone merge past red? | Branch protection + required status checks on the VCS side; Jenkins reports, the VCS enforces |
| Do secrets stay in the store? | Credentials store by ID, referenced as `credentials('id')` — never string-interpolated, never echoed (`domains/config.md`) |
| Is prod guarded by a human? | `input` step for prod deploys with the approver recorded — and an expiry (`timeout`) so the gate can't rot |
| Does the artifact get built once? | Build once, `stash`/artifact repository to later stages — never recompile on the way to prod (`domains/builds.md`) |
| Are agents reproducible? | Agents pinned to a docker image digest in the `agent {}` block — a snowflake agent is a works-on-my-machine server |
| Is rollback a job? | A parameterized rollback job (previous image tag) or a `rollback` stage — deployed and rehearsed, not folklore (`domains/recovery.md`) |

## The workflow

1. **Fast first**: `stage('Validate')` and `stage('Test')` before build; `when` conditions and
   stage order mean the slow machinery never starts on a broken cheap signal.
2. **Build once**: `stage('Build')` produces the artifact and stashes it; later stages `unstash`
   the same bytes.
3. **Deploy with the promise**: `stage('Deploy')` behind an `input` (approver recorded) with a
   `timeout`, and the rollback reference in the same file — previous image tag or the revert
   job, tested (`domains/recovery.md`).
4. **Prove the gates**: a `stage('Gate')` runs `ci-check --strict` against the Jenkinsfile
   itself — the gate gates its own pipeline.

## The bans to enforce

- Raw `sh` escape hatches carrying the pipeline's real logic (`sh '''…'''` snowflakes) —
  move it into the shared library, tested and reviewed (`domains/builds.md`).
- `|| true` and `set +e` in `sh` steps without a written `# reason` — the red mask,
  Jenkins edition (`ship-floor.md` #3).
- `retry(3)` around test stages — the flake still exists, now slower (H3).
- `echo $CREDENTIAL` and `printenv` — the console log becomes a credential store (S1).
- Untagged images in `agent { docker { image 'node' } }` — untagged is `:latest` (D2).
- `input` gates without a timeout, or deploys without any rollback reference (I2, P1).
- UI-tweaked job config that isn't in the Jenkinsfile — every such tweak is drift; find it
  with `env`, then put it in code.
