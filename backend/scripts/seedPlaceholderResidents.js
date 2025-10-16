const connectDB = require('../config/db');

async function upsertResident(conn, id, firstname, lastname) {
  // Check if exists
  const [rows] = await conn.execute('SELECT id FROM residents WHERE id = ?', [id]);
  if (rows.length > 0) {
    console.log(`Resident ${id} already exists, skipping.`);
    return;
  }
  await conn.execute(
    `INSERT INTO residents (id, firstname, lastname, middlename, purok, contact, barangay, created_at)
     VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NOW())`,
    [id, firstname, lastname]
  );
  console.log(`Inserted placeholder resident ${id} - ${lastname}, ${firstname}`);
}

async function main() {
  const conn = await connectDB();
  try {
    // Auto-detect missing referenced residents from complaints
    const [missing] = await conn.execute(`
      SELECT rid, role FROM (
        SELECT DISTINCT c.complainant_id AS rid, 'Complainant' AS role
        FROM complaints c
        LEFT JOIN residents r ON r.id = c.complainant_id
        WHERE c.complainant_id IS NOT NULL AND r.id IS NULL
        UNION
        SELECT DISTINCT c.respondent_id AS rid, 'Respondent' AS role
        FROM complaints c
        LEFT JOIN residents r ON r.id = c.respondent_id
        WHERE c.respondent_id IS NOT NULL AND r.id IS NULL
        UNION
        SELECT DISTINCT c.witness_id AS rid, 'Witness' AS role
        FROM complaints c
        LEFT JOIN residents r ON r.id = c.witness_id
        WHERE c.witness_id IS NOT NULL AND r.id IS NULL
      ) AS t
      ORDER BY rid
    `);
    if (missing.length === 0) {
      console.log('No missing referenced residents detected.');
      return;
    }
    for (const m of missing) {
      await upsertResident(conn, m.rid, 'Unknown', m.role);
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
