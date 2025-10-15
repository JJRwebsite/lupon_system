const connectDB = require('../config/db');

async function withConn(passed, fn) {
  if (passed) return fn(passed);
  const conn = await connectDB();
  try { return await fn(conn); } finally { await conn.end(); }
}

async function getUserStatsData(connection, userId) {
  return withConn(connection, async (conn) => {
    const [[{ count: totalCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE (complainant_id = ? OR respondent_id = ? OR user_id = ?)`,
      [userId, userId, userId]
    );
    const [[{ count: pendingCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status IN ('pending','ongoing','for_mediation','for_conciliation','for_arbitration') AND (complainant_id = ? OR respondent_id = ? OR user_id = ?)`,
      [userId, userId, userId]
    );
    const [[{ count: settledCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status IN ('settled','resolved') AND (complainant_id = ? OR respondent_id = ? OR user_id = ?)`,
      [userId, userId, userId]
    );
    const [[{ count: mediationSchedules }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM mediation m JOIN complaints c ON m.complaint_id = c.id WHERE m.date >= CURDATE() AND (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)`,
      [userId, userId, userId]
    );
    const [[{ count: totalMediation }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM mediation m JOIN complaints c ON m.complaint_id = c.id WHERE (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)`,
      [userId, userId, userId]
    );
    const [yearlyData] = await conn.execute(
      `SELECT MONTH(date_filed) as month, COUNT(*) as count FROM complaints WHERE YEAR(date_filed) = YEAR(CURDATE()) AND (complainant_id = ? OR respondent_id = ? OR user_id = ?) GROUP BY MONTH(date_filed) ORDER BY month`,
      [userId, userId, userId]
    );
    const [statusDistribution] = await conn.execute(
      `SELECT status, COUNT(*) as count FROM complaints WHERE (complainant_id = ? OR respondent_id = ? OR user_id = ?) GROUP BY status`,
      [userId, userId, userId]
    );
    const [recentActivities] = await conn.execute(
      `SELECT c.id, c.case_title, c.status, c.date_filed, 'case_filed' as activity_type FROM complaints c WHERE (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?) ORDER BY c.date_filed DESC LIMIT 5`,
      [userId, userId, userId]
    );

    return {
      totalCases,
      pendingCases,
      settledCases,
      mediationSchedules,
      totalMediation,
      yearlyData,
      statusDistribution,
      recentActivities,
    };
  });
}

async function getUserSchedulesData(connection, userId) {
  return withConn(connection, async (conn) => {
    // Mediation schedules
    const [mediationRows] = await conn.execute(
      `SELECT m.id as schedule_id, c.id as case_id, c.case_title, 'mediation' as session_type, m.date, m.time
       FROM mediation m JOIN complaints c ON m.complaint_id = c.id
       WHERE (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)`,
      [userId, userId, userId]
    );
    // Conciliation schedules
    const [conciliationRows] = await conn.execute(
      `SELECT con.id as schedule_id, c.id as case_id, c.case_title, 'conciliation' as session_type, con.date, con.time
       FROM conciliation con JOIN complaints c ON con.complaint_id = c.id
       WHERE (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)`,
      [userId, userId, userId]
    );
    // Arbitration schedules
    const [arbitrationRows] = await conn.execute(
      `SELECT a.id as schedule_id, c.id as case_id, c.case_title, 'arbitration' as session_type, a.date, a.time
       FROM arbitration a JOIN complaints c ON a.complaint_id = c.id
       WHERE (c.complainant_id = ? OR c.respondent_id = ? OR c.user_id = ?)`,
      [userId, userId, userId]
    );

    return { mediationRows, conciliationRows, arbitrationRows };
  });
}

module.exports = {
  getUserStatsData,
  getUserSchedulesData,
};
