const connectDB = require('../config/db');

async function withConn(passed, fn) {
  if (passed) return fn(passed);
  const conn = await connectDB();
  try { return await fn(conn); } finally { await conn.end(); }
}

// Stats for admin dashboard
async function getAdminStatsData(connection) {
  return withConn(connection, async (conn) => {
    const [[{ count: totalCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status != 'pending'`
    );
    const [[{ count: pendingCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status IN ('pending','ongoing','for_mediation','for_conciliation','for_arbitration')`
    );
    const [[{ count: settledCases }]] = await conn.execute(
      `SELECT COUNT(DISTINCT s.complaint_id) as count FROM settlement s INNER JOIN complaints c ON s.complaint_id = c.id`
    );
    const [[{ count: cfaCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status = 'Settled'`
    );
    const [[{ count: mediationCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status = 'Mediation'`
    );
    const [[{ count: conciliationCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status = 'Conciliation'`
    );
    const [[{ count: arbitrationCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status = 'Arbitration'`
    );
    const [[{ count: withdrawnCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM complaints WHERE status = 'withdrawn'`
    );
    const [[{ count: referralCases }]] = await conn.execute(
      `SELECT COUNT(*) as count FROM referrals`
    );

    const [monthlyCasesRows] = await conn.execute(
      `SELECT EXTRACT(MONTH FROM created_at)::INT as month, COUNT(*) as count
       FROM complaints
       WHERE date_trunc('year', created_at) = date_trunc('year', CURRENT_DATE)
       GROUP BY EXTRACT(MONTH FROM created_at)
       ORDER BY month`
    );

    const [statusDistribution] = await conn.execute(
      `SELECT status, COUNT(*) as count FROM complaints GROUP BY status ORDER BY count DESC`
    );

    const [recentActivities] = await conn.execute(
      `SELECT c.id, c.case_title as title, c.status, c.created_at as date,
              TRIM(CONCAT(UPPER(COALESCE(r1.lastname,'')), ', ', UPPER(COALESCE(r1.firstname,'')),
                CASE WHEN COALESCE(r1.middlename,'') <> '' THEN CONCAT(' ', UPPER(r1.middlename)) ELSE '' END)) as complainant,
              TRIM(CONCAT(UPPER(COALESCE(r2.lastname,'')), ', ', UPPER(COALESCE(r2.firstname,'')),
                CASE WHEN COALESCE(r2.middlename,'') <> '' THEN CONCAT(' ', UPPER(r2.middlename)) ELSE '' END)) as respondent
       FROM complaints c
       LEFT JOIN residents r1 ON c.complainant_id = r1.id
       LEFT JOIN residents r2 ON c.respondent_id = r2.id
       ORDER BY c.created_at DESC
       LIMIT 10`
    );

    // Build 12-month array
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const found = monthlyCasesRows.find(r => r.month === m);
      return { month: m, count: found ? found.count : 0, name: new Date(new Date().getFullYear(), i, 1).toLocaleString('default', { month: 'short' }) };
    });

    return {
      stats: { totalCases, pendingCases, settledCases, cfaCases, mediationCases, conciliationCases, arbitrationCases, withdrawnCases, referralCases },
      monthlyData,
      statusDistribution,
      recentActivities,
    };
  });
}

// Detailed analytics
async function getAdminAnalyticsData(connection) {
  return withConn(connection, async (conn) => {
    const [casesByType] = await conn.execute(
      `SELECT CASE
         WHEN status LIKE '%mediation%' THEN 'Mediation'
         WHEN status LIKE '%conciliation%' THEN 'Conciliation'
         WHEN status LIKE '%arbitration%' THEN 'Arbitration'
         ELSE 'Other' END as type,
       COUNT(*) as count FROM complaints GROUP BY type`
    );
    const [[resolutionStats]] = await conn.execute(
      `SELECT 
         AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) as avg_resolution_days,
         MIN(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) as min_resolution_days,
         MAX(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400.0) as max_resolution_days
       FROM complaints 
       WHERE status IN ('settled','resolved') AND updated_at IS NOT NULL`
    );
    return { casesByType, resolutionStats: resolutionStats || { avg_resolution_days: 0, min_resolution_days: 0, max_resolution_days: 0 } };
  });
}

// Demographics data
async function getDemographicsData(connection) {
  return withConn(connection, async (conn) => {
    const [caseTypes] = await conn.execute(
      `SELECT nature_of_case as case_type, COUNT(*) as count
       FROM complaints WHERE nature_of_case IS NOT NULL AND nature_of_case != ''
       GROUP BY nature_of_case ORDER BY count DESC LIMIT 10`
    );
    const [sitioData] = await conn.execute(
      `SELECT r.purok as sitio, COUNT(DISTINCT c.id) as case_count
       FROM complaints c
       LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
       WHERE r.purok IS NOT NULL AND r.purok != ''
       GROUP BY r.purok ORDER BY case_count DESC LIMIT 10`
    );
    const [barangayData] = await conn.execute(
      `SELECT r.barangay, COUNT(DISTINCT c.id) as case_count
       FROM complaints c
       LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
       WHERE r.barangay IS NOT NULL AND r.barangay != ''
       GROUP BY r.barangay ORDER BY case_count DESC LIMIT 10`
    );
    const [[{ total: totalCases }]] = await conn.execute(`SELECT COUNT(*) as total FROM complaints`);
    const [[{ total: totalResidents }]] = await conn.execute(`SELECT COUNT(*) as total FROM residents`);

    const demographics = {
      caseTypes: caseTypes.map(x => ({ name: x.case_type || 'Unknown', count: x.count, percentage: totalCases > 0 ? ((x.count / totalCases) * 100).toFixed(1) : '0' })),
      sitioData: sitioData.map(x => ({ name: x.sitio || 'Unknown', count: x.case_count, percentage: totalCases > 0 ? ((x.case_count / totalCases) * 100).toFixed(1) : '0' })),
      barangayData: barangayData.map(x => ({ name: x.barangay || 'Unknown', count: x.case_count, percentage: totalCases > 0 ? ((x.case_count / totalCases) * 100).toFixed(1) : '0' })),
      totalCases,
      totalResidents,
    };
    return demographics;
  });
}

module.exports = {
  getAdminStatsData,
  getAdminAnalyticsData,
  getDemographicsData,
};
