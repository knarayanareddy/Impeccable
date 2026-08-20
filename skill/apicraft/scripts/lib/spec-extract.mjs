/**
 * Shared OpenAPI-subset extractor (zero dependencies, indentation-aware).
 * Reads the shape most real specs are written in: paths → operations,
 * components → schemas (properties/types/enums/required, inline and block lists).
 * Used by contract-diff.mjs and review.mjs.
 */

const listItem = (line) => {
  const m = /^\s*-\s+(.+)$/.exec(line);
  return m ? m[1].trim() : null;
};

export function extractOperations(text) {
  // ops: { "GET /orders": { operationId?, deprecated?, summary? } }
  const ops = {};
  const lines = text.split("\n");
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  for (let i = 0; i < lines.length; i++) {
    const pm = /^(\s*)(\/[\w{}/.-]*)\s*:\s*\{?\s*$/.exec(lines[i]);
    if (!pm) continue;
    const pathIndent = pm[1].length;
    const path = pm[2];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j];
      const indent = indentOf(line);
      if (line.trim() === "" || indent <= pathIndent) break;
      const mm = /^(get|post|put|patch|delete):\s*\{?\s*$/i.exec(line.trim());
      if (!mm) continue;
      const key = `${mm[1].toUpperCase()} ${path}`;
      ops[key] = { deprecated: false };
      for (let k = j + 1; k < lines.length; k++) {
        const l2 = lines[k];
        const i2 = indentOf(l2);
        if (l2.trim() === "") continue;
        if (i2 <= pathIndent + 2) break;
        if (/^operationId\s*:/.test(l2.trim())) {
          const om = l2.trim().match(/^operationId\s*:\s*(.+)$/);
          if (om) ops[key].operationId = om[1].replace(/["']/g, "");
        }
        if (/^deprecated\s*:\s*true/.test(l2.trim())) ops[key].deprecated = true;
        if (/^summary\s*:/.test(l2.trim())) {
          const sm = l2.trim().match(/^summary\s*:\s*(.+)$/);
          if (sm) ops[key].summary = sm[1].replace(/["']/g, "");
        }
      }
    }
  }
  return ops;
}

export function extractSchemas(text) {
  // schemas: { Name: { properties: { prop: { type, enum, required } } } }
  // Handles both block lists (- a) and inline lists ([a, b]) for required/enum.
  const schemas = {};
  const lines = text.split("\n");
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  let schemasIndent = -1;
  let i = 0;
  while (i < lines.length) {
    const lt = lines[i].trim();
    if (/^schemas\s*:\s*\{?\s*$/.test(lt)) { schemasIndent = indentOf(lines[i]); i += 1; continue; }
    if (schemasIndent === -1 || lt === "") { i += 1; continue; }
    const indent = indentOf(lines[i]);
    if (indent <= schemasIndent) { schemasIndent = -1; i += 1; continue; }
    const sm = /^(\w[\w.]*)\s*:\s*\{?\s*$/.exec(lt);
    if (!sm || indent !== schemasIndent + 2) { i += 1; continue; }
    const name = sm[1];
    const schema = { properties: {}, required: [] };
    schemas[name] = schema;
    i += 1;
    let propIndent = -1;
    while (i < lines.length) {
      const l = lines[i];
      const li = indentOf(l);
      const lt2 = l.trim();
      if (li <= schemasIndent + 2 && lt2 !== "") break; // next schema or end of block
      if (/^properties\s*:\s*\{?\s*$/.test(lt2)) { propIndent = li; i += 1; continue; }
      if (propIndent !== -1 && li === propIndent + 2) {
        const pm = /^(\w[\w.]*)\s*:/.exec(lt2);
        if (pm) {
          const prop = { type: null, enum: null, required: false };
          schema.properties[pm[1]] = prop;
          // flow-style inline object: `status: { type: string, enum: [a, b] }`
          const inline = /:\s*\{(.+)\}\s*$/.exec(lt2);
          if (inline) {
            const tm = /\btype\s*:\s*(\w+)/.exec(inline[1]);
            if (tm) prop.type = tm[1];
            const em = /\benum\s*:\s*\[([^\]]*)\]/.exec(inline[1]);
            if (em) prop.enum = em[1].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
            i += 1;
            continue;
          }
          i += 1;
          while (i < lines.length) {
            const p = lines[i];
            const pi = indentOf(p);
            const pt = p.trim();
            if (pi <= li && pt !== "") break;
            const tm = /^type\s*:\s*(\w+)/.exec(pt);
            if (tm) prop.type = tm[1];
            const em = /^enum\s*:\s*\[([^\]]*)\]/.exec(pt);
            if (em) prop.enum = em[1].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
            if (/^enum\s*:\s*\{?\s*$/.test(pt)) {
              const enums = [];
              i += 1;
              while (i < lines.length) {
                const item = listItem(lines[i]);
                if (item === null) break;
                enums.push(item.replace(/["']/g, ""));
                i += 1;
              }
              prop.enum = enums;
              continue;
            }
            i += 1;
          }
          continue;
        }
      }
      const rm = /^required\s*:\s*\[([^\]]*)\]/.exec(lt2);
      if (rm) {
        schema.required = rm[1].split(",").map((s) => s.trim().replace(/["']/g, "")).filter(Boolean);
      }
      if (/^required\s*:\s*\{?\s*$/.test(lt2)) {
        i += 1;
        while (i < lines.length) {
          const item = listItem(lines[i]);
          if (item === null) break;
          schema.required.push(item.replace(/["']/g, ""));
          i += 1;
        }
        continue;
      }
      i += 1;
    }
  }
  for (const s of Object.values(schemas)) {
    for (const r of s.required) if (s.properties[r]) s.properties[r].required = true;
  }
  return schemas;
}

// JSON specs parse natively (zero-dep): walk the object tree. Single-line JSON
// defeats line-based extraction, so JSON gets its own honest path.
function extractFromJson(obj) {
  const operations = {};
  for (const [path, methods] of Object.entries(obj.paths || {})) {
    if (!methods || typeof methods !== "object") continue;
    for (const [m, op] of Object.entries(methods)) {
      if (!/^(get|post|put|patch|delete)$/i.test(m) || !op || typeof op !== "object") continue;
      operations[`${m.toUpperCase()} ${path}`] = {
        deprecated: op.deprecated === true,
        operationId: op.operationId || "",
        summary: op.summary || "",
      };
    }
  }
  const schemas = {};
  for (const [name, schema] of Object.entries((obj.components || {}).schemas || {})) {
    if (!schema || typeof schema !== "object") continue;
    const properties = {};
    for (const [prop, p] of Object.entries(schema.properties || {})) {
      if (!p || typeof p !== "object") continue;
      properties[prop] = {
        type: typeof p.type === "string" ? p.type : null,
        enum: Array.isArray(p.enum) ? p.enum.map(String) : null,
        required: false,
      };
    }
    for (const r of Array.isArray(schema.required) ? schema.required : []) {
      if (properties[r]) properties[r].required = true;
    }
    schemas[name] = { properties, required: Array.isArray(schema.required) ? schema.required : [] };
  }
  return { operations, schemas };
}

export function extract(text) {
  if (/^\s*\{/.test(text)) {
    try {
      return extractFromJson(JSON.parse(text));
    } catch {
      return { operations: {}, schemas: {} }; // unparseable — conservative, never a false claim
    }
  }
  return { operations: extractOperations(text), schemas: extractSchemas(text) };
}
