const connectDB = require('../config/db');

// Compute next complaint ID for the current year (e.g., 2025001)
async function getNextComplaintId(connection) {
  const currentYear = new Date().getFullYear();
  const yearPrefix = currentYear.toString();
  const [existingYearIds] = await connection.execute(
    'SELECT id FROM complaints WHERE CAST(id AS TEXT) LIKE ? ORDER BY id::BIGINT DESC LIMIT 1',
    [`${yearPrefix}%`]
  );
  if (existingYearIds.length === 0) {
    return parseInt(`${yearPrefix}001`);
  }
  const lastId = existingYearIds[0].id.toString();
  const lastSequence = parseInt(lastId.slice(-3));
  const nextSequence = (lastSequence + 1).toString().padStart(3, '0');
  return parseInt(`${yearPrefix}${nextSequence}`);
}

// Update complaint core fields and party IDs by id
async function updateComplaintFields(connection, id, fields) {
  const { case_title, case_description, nature_of_case, relief_description, complainant_id, respondent_id, witness_id } = fields;
  await connection.execute(
    `UPDATE complaints 
     SET case_title = ?, case_description = ?, nature_of_case = ?, relief_description = ?, 
         complainant_id = ?, respondent_id = ?, witness_id = ? 
     WHERE id = ?`,
    [case_title, case_description, nature_of_case, relief_description, complainant_id, respondent_id, witness_id, id]
  );
}

// Update priority
async function updatePriorityById(connection, id, priority) {
  await connection.execute(
    `UPDATE complaints SET priority = ? WHERE id = ?`,
    [priority, id]
  );
}

// List complaints for a specific user with parties formatting
async function listUserComplaintsDetailed(connection, userId) {
  const [complaints] = await connection.execute(`
    SELECT c.*, 
           CASE 
             WHEN comp.lastname IS NOT NULL AND comp.firstname IS NOT NULL THEN 
               CONCAT(UPPER(comp.lastname), ', ', UPPER(comp.firstname), 
                      CASE WHEN comp.middlename IS NOT NULL AND comp.middlename != '' 
                           THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END)
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
                           THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END)
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
                           THEN CONCAT(' ', UPPER(wit.middlename)) ELSE '' END)
             WHEN wit.lastname IS NOT NULL THEN UPPER(wit.lastname)
             WHEN wit.firstname IS NOT NULL THEN UPPER(wit.firstname)
             WHEN wit.id IS NOT NULL THEN CONCAT('RESIDENT #', wit.id)
             ELSE 'UNKNOWN WITNESS'
           END as witness_name,
           wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
    FROM complaints c
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    WHERE (c.user_id = ? OR c.complainant_id = ? OR c.respondent_id = ?) AND c.status IS NOT NULL
    ORDER BY c.id DESC
  `, [userId, userId, userId]);

  const formattedComplaints = complaints.map((complaint) => {
    let complainants = [];
    let respondents = [];
    let witnesses = [];
    if (complaint.complainant_id && complaint.complainant_name) {
      complainants = [{ id: complaint.complainant_id, display_name: complaint.complainant_name, purok: complaint.complainant_purok, contact: complaint.complainant_contact, barangay: complaint.complainant_barangay }];
    }
    if (complaint.respondent_id && complaint.respondent_name) {
      respondents = [{ id: complaint.respondent_id, display_name: complaint.respondent_name, purok: complaint.respondent_purok, contact: complaint.respondent_contact, barangay: complaint.respondent_barangay }];
    }
    if (complaint.witness_id && complaint.witness_name) {
      witnesses = [{ id: complaint.witness_id, display_name: complaint.witness_name, purok: complaint.witness_purok, contact: complaint.witness_contact, barangay: complaint.witness_barangay }];
    }
    return {
      ...complaint,
      complainants,
      respondents,
      witnesses,
      complainant: complainants.length ? complainants[0] : null,
      respondent: respondents.length ? respondents[0] : null,
      witness: witnesses.length ? witnesses[0] : null,
      complainant_name: complaint.complainant_name || null,
      respondent_name: complaint.respondent_name || null,
      witness_name: complaint.witness_name || null,
    };
  });
  return formattedComplaints;
}

// List mediation schedules for a user's cases
async function listUserSchedulesDetailed(connection, userId) {
  // Get all complaints for user
  const [complaints] = await connection.execute('SELECT * FROM complaints WHERE user_id = ?', [userId]);
  let schedules = [];
  for (const complaint of complaints) {
    const [mediations] = await connection.execute('SELECT * FROM mediation WHERE complaint_id = ?', [complaint.id]);
    for (const mediation of mediations) {
      schedules.push({
        id: mediation.id,
        case_no: complaint.id,
        case_title: complaint.case_title,
        case_description: complaint.case_description,
        nature_of_case: complaint.nature_of_case,
        relief_description: complaint.relief_description,
        date_filed: complaint.date_filed,
        complainant: '',
        respondent: '',
        schedule_date: mediation.date,
        schedule_time: mediation.time,
        case_status: complaint.status,
      });
    }
  }
  // Fetch names for each schedule
  for (let sched of schedules) {
    const [row] = await connection.execute(`
      SELECT 
        TRIM(CONCAT(
          UPPER(COALESCE(comp.lastname,'')), ', ', UPPER(COALESCE(comp.firstname,'')),
          CASE WHEN COALESCE(comp.middlename,'') <> '' THEN CONCAT(' ', UPPER(comp.middlename)) ELSE '' END
        )) AS complainant_name,
        TRIM(CONCAT(
          UPPER(COALESCE(resp.lastname,'')), ', ', UPPER(COALESCE(resp.firstname,'')),
          CASE WHEN COALESCE(resp.middlename,'') <> '' THEN CONCAT(' ', UPPER(resp.middlename)) ELSE '' END
        )) AS respondent_name
      FROM complaints c
      LEFT JOIN residents comp ON c.complainant_id = comp.id
      LEFT JOIN residents resp ON c.respondent_id = resp.id
      WHERE c.id = ?
    `, [sched.case_no]);
    if (row.length > 0) {
      sched.complainant = row[0].complainant_name || '';
      sched.respondent = row[0].respondent_name || '';
    }
  }
  return schedules;
}

// Set complaint as withdrawn with timestamp
async function withdrawComplaintStatus(connection, complaintId) {
  // First ensure the date_withdrawn column exists
  try {
    await connection.execute(`
      ALTER TABLE complaints ADD COLUMN IF NOT EXISTS date_withdrawn TIMESTAMP
    `);
  } catch (error) {
    // Column might already exist, continue
    console.log('date_withdrawn column already exists or error adding:', error.message);
  }
  
  // Now update the complaint status
  await connection.execute(
    `UPDATE complaints SET status = 'withdrawn', date_withdrawn = NOW() WHERE id = ?`,
    [complaintId]
  );
}

// Replicates controller's complex SELECT for withdrawn complaints
async function listWithdrawnComplaintsDetailed(connection) {
  const [complaints] = await connection.execute(`
    SELECT 
           c.id,
           COALESCE(c.case_title, 'Untitled Case') AS case_title,
           c.case_description,
           c.nature_of_case,
           c.relief_description,
           c.status,
           c.user_id,
           c.created_at,
           c.date_filed,
           c.date_withdrawn,
           to_char(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS created_at_iso,
           to_char(c.date_filed, 'YYYY-MM-DD"T"HH24:MI:SS') AS date_filed_iso,
           to_char(c.date_withdrawn, 'YYYY-MM-DD"T"HH24:MI:SS') AS date_withdrawn_iso,
           c.complainant_id,
           c.respondent_id,
           c.witness_id,
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
           wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
    FROM complaints c
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    WHERE c.status = 'withdrawn'
    ORDER BY c.id DESC
  `);

  const formatted = complaints.map(complaint => {
    const complainantObj = complaint.complainant_id ? {
      id: complaint.complainant_id,
      display_name: complaint.complainant_name,
      name: complaint.complainant_name,
      purok: complaint.complainant_purok,
      contact: complaint.complainant_contact,
      barangay: complaint.complainant_barangay
    } : null;
    const respondentObj = complaint.respondent_id ? {
      id: complaint.respondent_id,
      display_name: complaint.respondent_name,
      name: complaint.respondent_name,
      purok: complaint.respondent_purok,
      contact: complaint.respondent_contact,
      barangay: complaint.respondent_barangay
    } : null;
    const witnessObj = complaint.witness_id ? {
      id: complaint.witness_id,
      display_name: complaint.witness_name,
      name: complaint.witness_name,
      purok: complaint.witness_purok,
      contact: complaint.witness_contact,
      barangay: complaint.witness_barangay
    } : null;

    return {
      ...complaint,
      complainant: complainantObj,
      respondent: respondentObj,
      witness: witnessObj,
      // Arrays for frontend compatibility
      complainants: complainantObj ? [complainantObj] : [],
      respondents: respondentObj ? [respondentObj] : [],
      witnesses: witnessObj ? [witnessObj] : [],
    };
  });

  return formatted;
}

// Insert complaint row
async function insertComplaint(connection, payload) {
  const {
    id,
    case_title,
    case_description,
    nature_of_case,
    relief_description,
    complainant_id,
    respondent_id,
    witness_id,
    status,
    user_id,
  } = payload;
  const [result] = await connection.execute(
    `INSERT INTO complaints (
      id, case_title, case_description, nature_of_case, relief_description,
      complainant_id, respondent_id, witness_id, status, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      case_title,
      case_description,
      nature_of_case,
      relief_description,
      complainant_id,
      respondent_id,
      witness_id,
      status,
      user_id || null,
    ]
  );
  return result;
}

// Get all admin/secretary users (used for notifications)
async function getAdminUsers(connection) {
  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE role IN ('admin', 'secretary')"
  );
  return rows;
}

// Replicates controller's complex SELECT for non-pending, non-withdrawn complaints
async function listComplaintsDetailed(connection) {
  const [complaints] = await connection.execute(`
    SELECT c.*, 
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
           wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
    FROM complaints c
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    WHERE c.status != 'withdrawn' AND c.status != 'pending' AND c.status IS NOT NULL
    ORDER BY c.id DESC
  `);

  const formatted = complaints.map((complaint) => {
    let complainants = [];
    let respondents = [];
    let witnesses = [];
    if (complaint.complainant_id && complaint.complainant_name) {
      complainants = [{
        id: complaint.complainant_id,
        display_name: complaint.complainant_name,
        name: complaint.complainant_name,
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay,
      }];
    }
    if (complaint.respondent_id && complaint.respondent_name) {
      respondents = [{
        id: complaint.respondent_id,
        display_name: complaint.respondent_name,
        name: complaint.respondent_name,
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay,
      }];
    }
    if (complaint.witness_id && complaint.witness_name) {
      witnesses = [{
        id: complaint.witness_id,
        display_name: complaint.witness_name,
        name: complaint.witness_name,
        purok: complaint.witness_purok,
        contact: complaint.witness_contact,
        barangay: complaint.witness_barangay,
      }];
    }
    return {
      ...complaint,
      complainants,
      respondents,
      witnesses,
      complainant: complainants.length > 0 ? complainants[0] : null,
      respondent: respondents.length > 0 ? respondents[0] : null,
      witness: witnesses.length > 0 ? witnesses[0] : null,
      complainant_name: complaint.complainant_name || null,
      respondent_name: complaint.respondent_name || null,
      witness_name: complaint.witness_name || null,
    };
  });

  return formatted;
}

// Replicates controller's complex SELECT for pending complaints
async function listPendingComplaintsDetailed(connection) {
  const [complaints] = await connection.execute(`
    SELECT c.*, 
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
           wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
    FROM complaints c
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    WHERE c.status = 'pending'
    ORDER BY c.id DESC
  `);

  const formatted = complaints.map((complaint) => {
    let complainants = [];
    let respondents = [];
    let witnesses = [];
    if (complaint.complainant_id && complaint.complainant_name) {
      complainants = [{
        id: complaint.complainant_id,
        display_name: complaint.complainant_name,
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay,
      }];
    }
    if (complaint.respondent_id && complaint.respondent_name) {
      respondents = [{
        id: complaint.respondent_id,
        display_name: complaint.respondent_name,
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay,
      }];
    }
    if (complaint.witness_id && complaint.witness_name) {
      witnesses = [{
        id: complaint.witness_id,
        display_name: complaint.witness_name,
        purok: complaint.witness_purok,
        contact: complaint.witness_contact,
        barangay: complaint.witness_barangay,
      }];
    }
    return {
      ...complaint,
      complainants,
      respondents,
      witnesses,
      complainant: complainants.length > 0 ? complainants[0] : null,
      respondent: respondents.length > 0 ? respondents[0] : null,
      witness: witnesses.length > 0 ? witnesses[0] : null
    };
  });

  return formatted;
}

// Fetch complaints with resident joins
async function listComplaints() {
  const connection = await connectDB();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        c.id,
        COALESCE(c.case_title, 'Untitled Case') AS case_title,
        c.case_description,
        c.nature_of_case,
        c.relief_description,
        c.status,
        c.user_id,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', r.id,
            'display_name', TRIM(CONCAT(
              UPPER(COALESCE(r.lastname,'')), ', ', UPPER(COALESCE(r.firstname,'')),
              CASE WHEN COALESCE(r.middlename,'') <> '' THEN CONCAT(' ', UPPER(r.middlename)) ELSE '' END
            ))
          )
        ) FILTER (WHERE r.id IS NOT NULL) AS parties
      FROM complaints c
      LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Fetch pending cases with resident joins
async function listPendingComplaints() {
  const connection = await connectDB();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        c.id,
        COALESCE(c.case_title, 'Untitled Case') AS case_title,
        c.case_description,
        c.nature_of_case,
        c.relief_description,
        c.status,
        c.user_id,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', r.id,
            'display_name', TRIM(CONCAT(
              UPPER(COALESCE(r.lastname,'')), ', ', UPPER(COALESCE(r.firstname,'')),
              CASE WHEN COALESCE(r.middlename,'') <> '' THEN CONCAT(' ', UPPER(r.middlename)) ELSE '' END
            ))
          )
        ) FILTER (WHERE r.id IS NOT NULL) AS parties
      FROM complaints c
      LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
      WHERE c.status = 'pending'
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    return rows;
  } finally {
    await connection.end();
  }
}

// Fetch pending count and latest timestamp
async function getPendingCountAndLatest() {
  const connection = await connectDB();
  try {
    const [rows] = await connection.execute(`
      SELECT 
        COUNT(*) AS pending_count, 
        MAX(date_filed) AS latest_timestamp
      FROM 
        complaints
      WHERE 
        status = 'pending'
    `);
    return rows[0];
  } finally {
    await connection.end();
  }
}

// Replicates controller's complex SELECT for complaints
async function listComplaintsDetailed(connection) {
  const [complaints] = await connection.execute(`
    SELECT c.*, 
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
           wit.purok as witness_purok, wit.contact as witness_contact, wit.barangay as witness_barangay
    FROM complaints c
    LEFT JOIN residents comp ON c.complainant_id = comp.id
    LEFT JOIN residents resp ON c.respondent_id = resp.id
    LEFT JOIN residents wit ON c.witness_id = wit.id
    ORDER BY c.id DESC
  `);

  const formatted = complaints.map((complaint) => {
    let complainants = [];
    let respondents = [];
    let witnesses = [];
    if (complaint.complainant_id && complaint.complainant_name) {
      complainants = [{
        id: complaint.complainant_id,
        display_name: complaint.complainant_name,
        purok: complaint.complainant_purok,
        contact: complaint.complainant_contact,
        barangay: complaint.complainant_barangay,
      }];
    }
    if (complaint.respondent_id && complaint.respondent_name) {
      respondents = [{
        id: complaint.respondent_id,
        display_name: complaint.respondent_name,
        purok: complaint.respondent_purok,
        contact: complaint.respondent_contact,
        barangay: complaint.respondent_barangay,
      }];
    }
    if (complaint.witness_id && complaint.witness_name) {
      witnesses = [{
        id: complaint.witness_id,
        display_name: complaint.witness_name,
        purok: complaint.witness_purok,
        contact: complaint.witness_contact,
        barangay: complaint.witness_barangay,
      }];
    }
    return {
      ...complaint,
      complainants,
      respondents,
      witnesses,
      complainant: complainants.length > 0 ? complainants[0] : null,
      respondent: respondents.length > 0 ? respondents[0] : null,
      witness: witnesses.length > 0 ? witnesses[0] : null,
      // Remove duplicate fields on the consumer side if needed
      complainant_name: undefined,
      complainant_purok: undefined,
      complainant_contact: undefined,
      complainant_barangay: undefined,
      respondent_name: undefined,
      respondent_purok: undefined,
      respondent_contact: undefined,
      respondent_barangay: undefined,
      witness_name: undefined,
      witness_purok: undefined,
      witness_contact: undefined,
      witness_barangay: undefined,
    };
  });

  return formatted;
}

module.exports = {
  getNextComplaintId,
  insertComplaint,
  getAdminUsers,
  listComplaintsDetailed,
  listPendingComplaintsDetailed,
  withdrawComplaintStatus,
  listWithdrawnComplaintsDetailed,
  updateComplaintFields,
  updatePriorityById,
  listUserComplaintsDetailed,
  listUserSchedulesDetailed,
  listComplaints,
  listPendingComplaints,
  getPendingCountAndLatest,
};
