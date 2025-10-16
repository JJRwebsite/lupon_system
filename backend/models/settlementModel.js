const connectDB = require('../config/db');

async function ensureSettlementTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS settlement (
      id SERIAL PRIMARY KEY,
      complaint_id INTEGER NOT NULL,
      settlement_type TEXT NOT NULL CHECK (settlement_type IN ('mediation','conciliation','arbitration')),
      settlement_date DATE NOT NULL,
      agreements TEXT NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      CONSTRAINT fk_settlement_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    )
  `);
}

// Return list of settlements with joined complaint info and computed party names (arrays)
async function listSettlementsDetailed(connection) {
  await ensureSettlementTable(connection);
  const [rows] = await connection.execute(`
    SELECT s.*, c.case_title, c.complainant_id, c.respondent_id, c.witness_id
    FROM settlement s
    LEFT JOIN complaints c ON s.complaint_id = c.id
    ORDER BY s.created_at DESC
  `);

  const result = [];
  for (const s of rows) {
    let complainants = [];
    let respondents = [];

    if (s.complainant_id) {
      try {
        const [r] = await connection.execute(
          `SELECT TRIM(CONCAT(COALESCE(lastname, ''), ', ', COALESCE(firstname, ''),\n                    CASE WHEN COALESCE(middlename,'') <> '' THEN CONCAT(' ', middlename) ELSE '' END)) as display_name\n           FROM residents WHERE id = ?`,
          [s.complainant_id]
        );
        complainants = r.length > 0 ? [r[0].display_name] : [`Resident ${s.complainant_id}`];
      } catch (_) {
        complainants = [`Resident ${s.complainant_id}`];
      }
    } else {
      complainants = ['Unknown Complainant'];
    }

    if (s.respondent_id) {
      try {
        const [r] = await connection.execute(
          `SELECT TRIM(CONCAT(COALESCE(lastname, ''), ', ', COALESCE(firstname, ''),\n                    CASE WHEN COALESCE(middlename,'') <> '' THEN CONCAT(' ', middlename) ELSE '' END)) as display_name\n           FROM residents WHERE id = ?`,
          [s.respondent_id]
        );
        respondents = r.length > 0 ? [r[0].display_name] : [`Resident ${s.respondent_id}`];
      } catch (_) {
        respondents = [`Resident ${s.respondent_id}`];
      }
    } else {
      respondents = ['Unknown Respondent'];
    }

    result.push({ ...s, complainants, respondents });
  }
  return result;
}

async function insertSettlement(connection, { complaint_id, settlement_type, settlement_date, agreements, remarks }) {
  await ensureSettlementTable(connection);
  const [result] = await connection.execute(
    `INSERT INTO settlement (complaint_id, settlement_type, settlement_date, agreements, remarks)\n     VALUES (?, ?, ?, ?, ?)`,
    [complaint_id, settlement_type, settlement_date, agreements, remarks || null]
  );
  return result.insertId;
}

async function getSettlementByIdDetailed(connection, id) {
  await ensureSettlementTable(connection);
  const [rows] = await connection.execute(
    `SELECT s.*, c.case_title, c.complainant_id, c.respondent_id\n     FROM settlement s JOIN complaints c ON s.complaint_id = c.id WHERE s.id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const s = rows[0];

  let complainants = [];
  let respondents = [];
  if (s.complainant_id) {
    const [r] = await connection.execute(
      `SELECT TRIM(CONCAT(COALESCE(lastname, ''), ', ', COALESCE(firstname, ''),\n                CASE WHEN COALESCE(middlename,'') <> '' THEN CONCAT(' ', middlename) ELSE '' END)) as display_name\n       FROM residents WHERE id = ?`,
      [s.complainant_id]
    );
    complainants = r.length > 0 ? [r[0].display_name] : [`Resident ${s.complainant_id}`];
  } else {
    complainants = ['Unknown Complainant'];
  }
  if (s.respondent_id) {
    const [r] = await connection.execute(
      `SELECT TRIM(CONCAT(COALESCE(lastname, ''), ', ', COALESCE(firstname, ''),\n                CASE WHEN COALESCE(middlename,'') <> '' THEN CONCAT(' ', middlename) ELSE '' END)) as display_name\n       FROM residents WHERE id = ?`,
      [s.respondent_id]
    );
    respondents = r.length > 0 ? [r[0].display_name] : [`Resident ${s.respondent_id}`];
  } else {
    respondents = ['Unknown Respondent'];
  }
  return { ...s, complainants, respondents };
}

async function updateSettlementById(connection, { id, settlement_date, agreements, remarks }) {
  const [res] = await connection.execute(
    `UPDATE settlement SET settlement_date = ?, agreements = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [settlement_date, agreements, remarks, id]
  );
  return res.affectedRows > 0;
}

async function deleteSettlementById(connection, id) {
  const [res] = await connection.execute(`DELETE FROM settlement WHERE id = ?`, [id]);
  return res.affectedRows > 0;
}

module.exports = {
  ensureSettlementTable,
  listSettlementsDetailed,
  insertSettlement,
  getSettlementByIdDetailed,
  updateSettlementById,
  deleteSettlementById,
};
