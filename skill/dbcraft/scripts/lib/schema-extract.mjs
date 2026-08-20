/**
 * Shared schema extractor (zero dependencies).
 *
 * Reads CREATE TABLE blocks and CREATE [UNIQUE] INDEX statements from SQL
 * text (schema snapshots, migration output, pg_dump-style dumps). Supports
 * the shared SQL subset: Postgres/MySQL/SQLite create-table syntax.
 * Used by schema-diff.mjs.
 *
 * Output shape:
 *   { tables: { name: { columns: [{ name, type, notNull, primaryKey,
 *       unique, default, references, onDelete }], primaryKeys: [names],
 *       checks: [expr], indexes: [{ name, unique, columns, partial }] } } }
 */

export function extractSchema(text) {
  const tables = {};

  // ---- CREATE TABLE blocks ----
  const blockRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"[]?([\w.]+)[`"\]]?\s*\(([\s\S]*?)\)\s*;/gi;
  let bm;
  while ((bm = blockRe.exec(text))) {
    const name = bm[1].split(".").pop(); // schema-qualified: keep the table part
    const body = bm[2];
    const table = { columns: [], primaryKeys: [], checks: [], indexes: [] };
    tables[name] = table;

    const colLineRe = /^\s*[`"]?([a-z_]\w*)[`"]?\s+([A-Z][A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*)*?(?:\s*\(\s*\d+\s*(?:,\s*\d+\s*)?\))?)(?=\s+(?:NOT|NULL|PRIMARY|UNIQUE|CHECK|REFERENCES|DEFAULT|CONSTRAINT|COLLATE|GENERATED)\b|\s*,|$)/i;
    const bodyLines = body.split("\n");
    const colDefs = [];
    // Re-join column definitions: each column starts at a line whose first token
    // is an identifier + type; continuation lines belong to it.
    let current = null;
    for (const line of bodyLines) {
      const cm = colLineRe.exec(line);
      if (cm && !/^(CONSTRAINT|PRIMARY|FOREIGN|UNIQUE|CHECK|KEY|INDEX)/i.test(cm[1])) {
        if (current) colDefs.push(current);
        current = { name: cm[1], type: cm[2].trim().toUpperCase(), rest: line.slice(cm[0].length) + " " };
      } else if (current) {
        current.rest += line + " ";
      } else if (/^\s*(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|KEY|INDEX)\b/i.test(line)) {
        if (current) { colDefs.push(current); current = null; }
        colDefs.push({ constraint: line.trim() });
      }
    }
    if (current) colDefs.push(current);

    for (const def of colDefs) {
      if (def.constraint) {
        const c = def.constraint;
        const pk = /PRIMARY\s+KEY\s*\(([^)]*)\)/i.exec(c);
        if (pk) table.primaryKeys.push(...pk[1].split(",").map((s) => s.trim().replace(/[`"]/g, "").split(/\s+/)[0]));
        const fk = /FOREIGN\s+KEY\s*(?:\(([^)]*)\))?\s*REFERENCES\s+[`"[\w.]+[`"\]]?\s*\([^)]*\)\s*([^,;\n]*)/i.exec(c);
        if (fk) {
          const colName = (fk[1] || "").trim().replace(/[`"]/g, "").split(",")[0].trim();
          const onDelete = /ON\s+DELETE\s+(\w+)/i.exec((fk[2] || "") + " " + (fk[3] || ""));
          const col = table.columns.find((x) => x.name === colName);
          if (col) {
            col.references = fk[0].match(/REFERENCES\s+[`"[\w.]+[`"\]]?/i)[0];
            col.onDelete = onDelete ? onDelete[1].toUpperCase() : null;
          }
        }
        const chk = /CHECK\s*\(([\s\S]*?)\)/i.exec(c);
        if (chk) table.checks.push(chk[1].trim());
        continue;
      }

      const col = {
        name: def.name,
        type: def.type || "?",
        notNull: /\bNOT\s+NULL\b/i.test(def.rest),
        primaryKey: /\bPRIMARY\s+KEY\b/i.test(def.rest),
        unique: /\bUNIQUE\b/i.test(def.rest),
        default: (def.rest.match(/\bDEFAULT\s+([^,\s]+)/i) || [null, null])[1],
        references: null,
        onDelete: null,
      };
      // inline CHECK on the column line is a table-level rule
      const inlineCheck = /\bCHECK\s*\(([\s\S]*?)\)/i.exec(def.rest);
      if (inlineCheck) table.checks.push(inlineCheck[1].trim());
      if (col.primaryKey) table.primaryKeys.push(col.name);
      const ref = /\bREFERENCES\s+[`"[\w.]+[`"\]]?\s*\([^)]*\)\s*([^,;]*)/i.exec(def.rest);
      if (ref) {
        col.references = ref[0].match(/REFERENCES\s+[`"[\w.]+[`"\]]?/i)[0];
        const od = /ON\s+DELETE\s+(\w+)/i.exec(ref[1] || "");
        col.onDelete = od ? od[1].toUpperCase() : null;
      }
      table.columns.push(col);
    }
  }

  // ---- CREATE INDEX statements (standalone) ----
  const idxRe = /CREATE\s+(UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([\w]+)[`"]?\s+ON\s+[`"[]?([\w.]+)[`"\]]?\s*\(([^)]*)\)\s*([^;]*);?/gi;
  let im;
  while ((im = idxRe.exec(text))) {
    const [, unique, idxName, tableName, cols, tail] = im;
    const table = tables[tableName.split(".").pop()];
    if (!table) continue;
    table.indexes.push({
      name: idxName,
      unique: !!unique,
      columns: cols.split(",").map((s) => s.trim().replace(/[`"]/g, "").split(/\s+/)[0]).filter(Boolean),
      partial: /WHERE\s+/i.test(tail),
    });
  }

  return { tables };
}
