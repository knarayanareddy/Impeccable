/**
 * Shipcraft pipeline rule vocabulary — shared by check.mjs (the repo scanner)
 * and ci-check.mjs (the per-pipeline gate), so the two tools can never drift.
 *
 * Every rule is a pure function of one line of text. `masked-failure` is the
 * one exception in how callers feed it: it must be tested against the RAW
 * line, because its `# reason…` comment escape hatch is comment evidence and
 * stripping would delete the evidence before the rule can see it.
 *
 * Severity semantics (suite-wide): errors fail (exit 1), warnings pass unless
 * --strict. A gate you want to block should be run with --strict in CI.
 */

export const SECRET_NAME =
  /(?:^|[\s_.\-"'{$])(password|passwd|secrets?|api[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key|credential|client[_-]?secret|signing[_-]?key|jwt[_-]?secret)\w*/i;

export const RULES = [
  {
    id: "secret-echo",
    severity: "error",
    message: "Secret echoed in a pipeline step — the build log becomes a credential store (S1). Reference by name, never print.",
    test(line) {
      if (!SECRET_NAME.test(line)) return null;
      const isEcho = /\b(echo|printf)\b/i.test(line) || /\bprintenv\b/i.test(line) || (/\benv\b/i.test(line) && !/env\s*:/i.test(line));
      if (!isEcho) return null;
      return "secret in log output";
    },
  },
  {
    id: "pipe-to-shell",
    severity: "warning",
    message: "curl/wget piped to shell — executing the internet with CI's permissions (H4). Use pinned, checksummed installers.",
    test(line) {
      const m = /\b(curl|wget)\b[^|]*\|\s*(?:sudo\s+)?(?:ba)?sh\b/i.exec(line);
      if (m) return "curl | sh";
      // to-file-then-execute form: curl -o install.sh URL && bash install.sh —
      // unless the download is checksum-verified first, which is the H4 floor itself
      if (/\b(curl|wget)\b[^;]*-(?:o|output)\s+\S+[^;]*(?:&&|;)\s*(?:sudo\s+)?(?:ba)?sh\b/i.test(line)) {
        if (/\b(sha(?:256|1|512)sum\s+(-c|--check)|md5sum\s+-c|gpg\s+--verify)\b/i.test(line)) return null;
        return "curl -o file && sh";
      }
      return null;
    },
  },
  {
    id: "masked-failure",
    severity: "error",
    message: "Red mask — the step's failure is swallowed (H1). Fix the step or delete it; a mask is an incident in waiting.",
    test(line) {
      const m = /\|\|\s*(true|exit\s+0)\s*;?|continue-on-error\s*:\s*true|allow_failure\s*:\s*true|(?:^|[\s:;])set\s+\+e\b/i.exec(line);
      if (!m) return null;
      // A written reason keeps it a reviewed exception, not a mask
      if (/#.*(reason|because|ticket|issue|known|temporary|todo|fixme)/i.test(line)) return null;
      return m[0].trim().slice(0, 40);
    },
  },
  {
    id: "unpinned-install",
    severity: "warning",
    message: "Unpinned install in CI — versions drift run-to-run (D1). Use the lockfile discipline (npm ci, frozen installs).",
    test(line) {
      if (/\bnpm\s+(i|install)\b(?!.*(?:ci|--frozen|--immutable))/i.test(line)) return "npm install";
      if (/\byarn\s+(add|install)\b/i.test(line) && !/--frozen-lockfile|--immutable/.test(line)) return "yarn install";
      if (/\bpip\s+install\b/i.test(line) && !/(-r\s+[^\s]*(?:lock|requirements\.txt)|--require-hashes|pip-compile)/i.test(line)) return "pip install";
      if (/\bgo\s+get\b/i.test(line) && !/go\s+mod\s+(download|verify)/i.test(line)) return "go get";
      if (/\bpnpm\s+(add|install)\b/i.test(line) && !/--frozen-lockfile|--frozen/.test(line)) return "pnpm install";
      if (/\bbun\s+(add|install)\b/i.test(line) && !/--frozen-lockfile/.test(line)) return "bun install";
      return null;
    },
  },
  {
    id: "latest-tag",
    severity: "warning",
    message: "`:latest` image tag in a pipeline — 'latest' is a different image tomorrow (D2). Pin versions or digests.",
    test(line) {
      const m = /[\w./-]+:latest\b/i.exec(line);
      if (m) return m[0];
      // untagged reference — no tag IS latest: `image: app`, `FROM node`, `docker build -t app`
      const u = /\bimage\s*:\s*["']?[\w./-]+["']?\s*$/i.exec(line) || /^\s*FROM\s+[\w./-]+\s*$/i.exec(line) ||
        /\s-t\s+["']?[\w./-]+["']?(?=\s|$)/i.exec(line);
      if (u) return `${u[0].trim()} (untagged = latest)`;
      return null;
    },
  },
  {
    id: "force-flag",
    severity: "warning",
    message: "Force flag on a push/publish/destructive operation — the flag exists to override guards (H1-adjacent).",
    test(line) {
      // `git push -f` — the -f shorthand IS force. Everywhere else `-f` means
      // something else (`kubectl apply -f` is --filename), so require --force.
      const m = /\bgit\s+push\b[^|]*\s(-f|--force)(?!-with-lease)\b/i.exec(line);
      if (m) return m[0].trim();
      const m2 = /\b(npm\s+publish|docker\s+push|helm\s+upgrade|kubectl\s+apply|terraform\s+apply)\b[^|]*\s--force\b/i.exec(line);
      return m2 ? m2[0].trim() : null;
    },
  },
  {
    id: "destructive-op",
    severity: "warning",
    message: "Destructive operation in a pipeline without a visible approval/recovery reference (I2). Guard it, log it, make it reversible.",
    test(line) {
      const m = /\b(rm\s+-rf|kubectl\s+delete|terraform\s+destroy|helm\s+uninstall|\bDROP\s+TABLE)\b/i.exec(line);
      if (!m) return null;
      if (/(approval|manual|review|rollback|revert|restore|backup)/i.test(line)) return null;
      return m[0].trim();
    },
  },
];

/**
 * Stateful comment stripping — comments are prose, not evidence. Handles
 * multi-line / * * / blocks and line `#` comments for the CI-config languages
 * (yaml/sh/toml/make); URL double-slashes are never comment starts here since
 * `//` comments are not stripped for these file types.
 */
export function stripComments(rawLines, file) {
  const lines = [];
  let inBlock = false;
  for (const raw of rawLines) {
    let line = raw;
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) { lines.push(""); continue; }
      line = " ".repeat(end + 2) + line.slice(end + 2);
      inBlock = false;
    }
    let out = "";
    let i = 0;
    while (i < line.length) {
      if (line.startsWith("/*", i)) {
        const end = line.indexOf("*/", i + 2);
        if (end === -1) { inBlock = true; break; }
        out += " ".repeat(end + 2 - i);
        i = end + 2;
      } else if (/\.(yaml|yml|sh|bash|mk|makefile|toml)$/i.test(file) && line.startsWith("#", i)) {
        break;
      } else {
        out += line[i];
        i += 1;
      }
    }
    lines.push(out);
  }
  return lines;
}
