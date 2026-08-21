// Criterion popup — injects scanner.js into the active tab, renders findings.
const summary = document.getElementById("summary");
const results = document.getElementById("results");
const scanBtn = document.getElementById("scan");

const SEV_LABEL = { error: "error", warning: "warning", info: "info" };

function render(findings, scanned) {
  results.innerHTML = "";
  summary.className = "hidden";

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");

  summary.classList.remove("hidden");
  if (errors.length) {
    summary.className = "bad";
    summary.textContent = `${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} note(s) — ${scanned} elements scanned`;
  } else if (warnings.length) {
    summary.className = "warn";
    summary.textContent = `No errors · ${warnings.length} warning(s), ${infos.length} note(s) — ${scanned} elements scanned`;
  } else {
    summary.className = "ok";
    summary.textContent = `Clean ✓ — ${scanned} elements scanned, no findings`;
  }

  if (!findings.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nothing to report. The floor holds.";
    results.appendChild(li);
    return;
  }

  // de-dupe by rule+el; keep the first
  const seen = new Set();
  for (const f of findings) {
    const key = f.rule + "|" + f.el;
    if (seen.has(key)) continue;
    seen.add(key);
    const li = document.createElement("li");
    const line = document.createElement("div");
    line.className = "rule-line";
    const sev = document.createElement("span");
    sev.className = "sev " + f.severity;
    sev.textContent = SEV_LABEL[f.severity] || f.severity;
    const id = document.createElement("span");
    id.className = "rule-id";
    id.textContent = f.rule;
    line.append(sev, id);
    li.appendChild(line);
    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = f.message;
    li.appendChild(msg);
    const det = document.createElement("div");
    det.className = "detail";
    det.textContent = f.detail || "";
    li.appendChild(det);
    const el = document.createElement("div");
    el.className = "el";
    el.textContent = f.el || "";
    li.appendChild(el);
    results.appendChild(li);
  }
}

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || "")) {
      results.innerHTML = "";
      summary.className = "bad";
      summary.classList.remove("hidden");
      summary.textContent = "This page type can't be scanned (chrome:// or empty tab).";
      return;
    }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["scanner.js"] });
    const [outcome] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => (window.__criterionScan ? window.__criterionScan() : null),
    });
    const data = outcome && outcome.result;
    if (!data) {
      results.innerHTML = "";
      summary.className = "bad";
      summary.classList.remove("hidden");
      summary.textContent = "Scanner failed to run — reload the tab and retry.";
      return;
    }
    render(data.findings || [], data.scanned || 0);
  } catch (err) {
    summary.className = "bad";
    summary.classList.remove("hidden");
    summary.textContent = "Error: " + err.message;
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan this page";
  }
});
