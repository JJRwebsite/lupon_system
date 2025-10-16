/*
  Simple MySQL dump -> PostgreSQL importer
  - Reads .sql dump file
  - Skips DDL, processes INSERT INTO ... VALUES ...; statements
  - Converts backticked identifiers to plain
  - Converts tinyint(1) 0/1 usage into boolean for known columns
  - Uses backend/config/db connectDB adapter (pg under the hood)

  Usage: node scripts/importFromMysqlDump.js <path-to-dump.sql>
*/
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');

// Known boolean columns in our PG schema
const BOOLEAN_COLUMNS = new Set([
  'mediation.is_deleted',
  'notifications.is_read',
  'users.is_verified',
]);

function toBooleanIfNeeded(table, col, valueLiteral) {
  const key = `${table}.${col}`;
  if (!BOOLEAN_COLUMNS.has(key)) return valueLiteral;
  // Value literal may be unquoted number or quoted string; normalize
  const trimmed = valueLiteral.trim();
  if (trimmed === '1' || trimmed === "'1'" || trimmed.toLowerCase() === 'true') return 'TRUE';
  if (trimmed === '0' || trimmed === "'0'" || trimmed.toLowerCase() === 'false') return 'FALSE';
  // Fallback passthrough
  return valueLiteral;
}

function splitInsertValues(valuesChunk) {
  // Splits values respecting parentheses and quotes
  const tuples = [];
  let depth = 0, start = 0, inStr = false, esc = false;
  for (let i = 0; i < valuesChunk.length; i++) {
    const c = valuesChunk[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === "'") { inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) {
      tuples.push(valuesChunk.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = valuesChunk.slice(start).trim();
  if (last) tuples.push(last);
  return tuples;
}

function parseValueList(tupleStr) {
  // Remove outer parentheses
  const inner = tupleStr.trim().replace(/^\(/, '').replace(/\)$/,'');
  const vals = [];
  let inStr = false, esc = false, buff = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inStr) {
      buff += c;
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === "'") { inStr = false; }
      continue;
    }
    if (c === "'") { inStr = true; buff += c; continue; }
    if (c === ',') { vals.push(buff.trim()); buff = ''; continue; }
    buff += c;
  }
  if (buff.length) vals.push(buff.trim());
  return vals;
}

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error('Usage: node scripts/importFromMysqlDump.js <dump.sql>');
    process.exit(1);
  }
  const full = path.resolve(sqlPath);
  const content = fs.readFileSync(full, 'utf8');

  // Normalize line breaks and collapse comments
  const lines = content.split(/\r?\n/);
  const inserts = [];
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (l.startsWith('--')) continue;
    if (l.startsWith('/*') || l.startsWith('*/')) continue;
    if (l.toUpperCase().startsWith('INSERT INTO')) inserts.push(line);
  }

  // Merge multi-line INSERTs into single statements
  const statements = [];
  let acc = '';
  for (const raw of inserts) {
    acc += raw + '\n';
    if (raw.trim().endsWith(';')) { statements.push(acc); acc = ''; }
  }
  if (acc.trim()) statements.push(acc);

  const conn = await connectDB();
  try {
    // Disable constraints temporarily if needed (Neon may restrict this)
    for (const stmt of statements) {
      // Example: INSERT INTO `table` (`col1`,`col2`) VALUES (...),(...);
      const m = stmt.match(/INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*);/i);
      if (!m) continue;
      const table = m[1];
      const columns = m[2].split(',').map(s => s.trim().replace(/`/g, ''));
      const valuesChunk = m[3].trim();
      const tupleStrs = splitInsertValues(valuesChunk);

      for (const tup of tupleStrs) {
        const vals = parseValueList(tup);
        // Align columns and convert booleans where needed
        const pgVals = vals.map((v, idx) => toBooleanIfNeeded(table, columns[idx], v));
        // Build parameterized INSERT with explicit values (already literals), so just splice
        const colList = columns.join(', ');
        const valuesLiteral = pgVals.join(', ');
        const sql = `INSERT INTO ${table} (${colList}) VALUES (${valuesLiteral})`;
        try {
          await conn.execute(sql);
        } catch (err) {
          // Log and continue; common issues could be duplicates
          console.warn(`Insert into ${table} failed:`, err.message);
        }
      }
    }
    console.log('Import completed.');
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
