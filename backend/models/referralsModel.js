const connectDB = require('../config/db');

async function withConn(passed, fn) {
  if (passed) return fn(passed);
  const conn = await connectDB();
  try { return await fn(conn); } finally { await conn.end(); }
}

async function createReferralsTableDb(connection) {
  return withConn(connection, async (conn) => {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_complaint_id INT NOT NULL,
        case_title VARCHAR(255) NOT NULL,
        case_description TEXT,
        nature_of_case VARCHAR(255),
        relief_sought TEXT,
        incident_date DATE,
        incident_time TIME,
        incident_place VARCHAR(255),
        complainant_id INT,
        respondent_id INT,
        witness_id INT,
        referred_to VARCHAR(255) NOT NULL,
        referral_reason TEXT,
        referred_by INT,
        date_referred TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'referred',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const columnsToAdd = [
      { name: 'case_description', type: 'TEXT' },
      { name: 'nature_of_case', type: 'VARCHAR(255)' },
      { name: 'relief_sought', type: 'TEXT' },
      { name: 'incident_date', type: 'DATE' },
      { name: 'incident_time', type: 'TIME' },
      { name: 'incident_place', type: 'VARCHAR(255)' },
      { name: 'date_referred', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ];
    for (const column of columnsToAdd) {
      try { await conn.execute(`ALTER TABLE referrals ADD COLUMN ${column.name} ${column.type}`); } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {/* ignore */}
      }
    }
    try {
      const [rows] = await conn.execute(`SELECT COUNT(*) as count FROM referrals WHERE date_referred IS NULL`);
      if (rows[0].count > 0) {
        await conn.execute(`UPDATE referrals SET date_referred = COALESCE(created_at, NOW()) WHERE date_referred IS NULL`);
      }
    } catch (e) {
      if (e.code !== 'ER_BAD_FIELD_ERROR') {/* ignore */}
    }
    return true;
  });
}

async function transferComplaintDb(connection, { complaintId, referred_to, referral_reason, referred_by }) {
  return withConn(connection, async (conn) => {
    await createReferralsTableDb(conn);
    // Load original complaint
    const [complaints] = await conn.execute(`SELECT * FROM complaints WHERE id = ?`, [complaintId]);
    if (complaints.length === 0) throw new Error('Complaint not found');
    const c = complaints[0];
    // Insert referral
    const [ins] = await conn.execute(
      `INSERT INTO referrals (original_complaint_id, case_title, case_description, nature_of_case, relief_sought,
        incident_date, incident_time, incident_place, complainant_id, respondent_id, witness_id, referred_to, referral_reason, referred_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.case_title, c.case_description || null, c.nature_of_case || null, c.relief_description || null,
       c.incident_date || null, c.incident_time || null, c.incident_place || null, c.complainant_id || null,
       c.respondent_id || null, c.witness_id || null, referred_to, referral_reason || null, referred_by || null]
    );
    // Update complaint status if needed
    await conn.execute(`UPDATE complaints SET status = 'referred' WHERE id = ?`, [complaintId]);
    return ins.insertId;
  });
}

async function listReferralsDetailed(connection) {
  return withConn(connection, async (conn) => {
    await createReferralsTableDb(conn);
    const [referrals] = await conn.execute(`
      SELECT r.*, 
             CASE 
               WHEN comp.lastname IS NOT NULL AND comp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(comp.lastname), ', ', UPPER(comp.firstname), 
                        CASE WHEN comp.middlename IS NOT NULL AND comp.middlename != '' 
                             THEN CONCAT(' ', UPPER(comp.middlename)) 
                             ELSE '' END)
               WHEN comp.lastname IS NOT NULL THEN UPPER(comp.lastname)
               WHEN comp.firstname IS NOT NULL THEN UPPER(comp.firstname)
               WHEN comp.id IS NOT NULL THEN CONCAT('RESIDENT #', comp.id)
               ELSE 'UNKNOWN COMPLAINANT'
             END as complainant_name, 
             comp.purok as complainant_purok, comp.contact as complainant_contact, comp.barangay as complainant_barangay,
             CASE 
               WHEN resp.lastname IS NOT NULL AND resp.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(resp.lastname), ', ', UPPER(resp.firstname), 
                        CASE WHEN resp.middlename IS NOT NULL AND resp.middlename != '' 
                             THEN CONCAT(' ', UPPER(resp.middlename)) 
                             ELSE '' END)
               WHEN resp.lastname IS NOT NULL THEN UPPER(resp.lastname)
               WHEN resp.firstname IS NOT NULL THEN UPPER(resp.firstname)
               WHEN resp.id IS NOT NULL THEN CONCAT('RESIDENT #', resp.id)
               ELSE 'UNKNOWN RESPONDENT'
             END as respondent_name, 
             resp.purok as respondent_purok, resp.contact as respondent_contact, resp.barangay as respondent_barangay,
             CASE 
               WHEN wit.lastname IS NOT NULL AND wit.firstname IS NOT NULL THEN 
                 CONCAT(UPPER(wit.lastname), ', ', UPPER(wit.firstname), 
                        CASE WHEN wit.middlename IS NOT NULL AND wit.middlename != '' 
                             THEN CONCAT(' ', UPPER(wit.middlename)) 
                             ELSE '' END)
               WHEN wit.lastname IS NOT NULL THEN UPPER(wit.lastname)
               WHEN wit.firstname IS NOT NULL THEN UPPER(wit.firstname)
               WHEN wit.id IS NOT NULL THEN CONCAT('RESIDENT #', wit.id)
               ELSE 'UNKNOWN WITNESS'
             END as witness_name, 
             wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay,
             CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.middle_name, ''), ' ', COALESCE(u.last_name, '')) as referred_by_name
      FROM referrals r
      LEFT JOIN residents comp ON r.complainant_id = comp.id
      LEFT JOIN residents resp ON r.respondent_id = resp.id
      LEFT JOIN residents wit ON r.witness_id = wit.id
      LEFT JOIN users u ON r.referred_by = u.id
      ORDER BY r.created_at DESC
    `);

    const formatted = referrals.map(r => ({
      id: r.id,
      original_complaint_id: r.original_complaint_id,
      case_title: r.case_title,
      case_description: r.case_description,
      nature_of_case: r.nature_of_case,
      relief_sought: r.relief_sought,
      incident_date: r.incident_date,
      incident_time: r.incident_time,
      incident_place: r.incident_place,
      complainant: r.complainant_id ? {
        id: r.complainant_id,
        name: r.complainant_name,
        purok: r.complainant_purok,
        contact: r.complainant_contact,
        barangay: r.complainant_barangay
      } : null,
      respondent: r.respondent_id ? {
        id: r.respondent_id,
        name: r.respondent_name,
        purok: r.respondent_purok,
        contact: r.respondent_contact,
        barangay: r.respondent_barangay
      } : null,
      witness: r.witness_id ? {
        id: r.witness_id,
        name: r.witness_name,
        purok: r.witness_purok,
        contact: r.witness_contact,
        barangay: r.witness_barangay
      } : null,
      referred_to: r.referred_to,
      referral_reason: r.referral_reason,
      referred_by: r.referred_by_name,
      date_referred: r.date_referred,
      status: r.status,
      created_at: r.created_at,
    }));
    return formatted;
  });
}

async function updateReferralStatusDb(connection, referralId, status) {
  return withConn(connection, async (conn) => {
    await conn.execute('UPDATE referrals SET status = ? WHERE id = ?', [status, referralId]);
    return true;
  });
}

async function deleteReferralDb(connection, referralId) {
  return withConn(connection, async (conn) => {
    const [res] = await conn.execute('DELETE FROM referrals WHERE id = ?', [referralId]);
    return res.affectedRows > 0;
  });
}

module.exports = {
  createReferralsTableDb,
  transferComplaintDb,
  listReferralsDetailed,
  updateReferralStatusDb,
  deleteReferralDb,
};
