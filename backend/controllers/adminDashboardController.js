const connectDB = require('../config/db');

// Get admin dashboard statistics
exports.getAdminStats = async (req, res) => {
  try {
    const connection = await connectDB();

    // Get total cases (excluding pending cases as they are not officially accepted)
    const [totalCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints
      WHERE status != 'pending'
    `);

    // Get pending cases
    const [pendingCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status IN ('pending', 'ongoing', 'for_mediation', 'for_conciliation', 'for_arbitration')
    `);

    // Get settled cases (count unique complaints that have settlements)
    const [settledCases] = await connection.execute(`
      SELECT COUNT(DISTINCT s.complaint_id) as count 
      FROM settlement s
      INNER JOIN complaints c ON s.complaint_id = c.id
    `);

    // Get CFA (Certificate of Final Award) cases
    const [cfaCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status = 'cfa'
    `);

    // Get mediation cases (count complaints with Mediation status)
    const [mediationCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status = 'Mediation'
    `);

    // Get conciliation cases (count complaints with conciliation status)
    const [conciliationCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status LIKE '%conciliation%'
    `);

    // Get arbitration cases (count complaints with Arbitration status)
    const [arbitrationCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status = 'Arbitration'
    `);

    // Get withdrawn cases
    const [withdrawnCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM complaints 
      WHERE status = 'withdrawn'
    `);

    // Get referral cases
    const [referralCases] = await connection.execute(`
      SELECT COUNT(*) as count FROM referrals
    `);

    // Get monthly cases for the current year
    const [monthlyCases] = await connection.execute(`
      SELECT 
        MONTH(created_at) as month,
        COUNT(*) as count
      FROM complaints 
      WHERE YEAR(created_at) = YEAR(CURDATE())
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `);

    // Get case distribution by status
    const [statusDistribution] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM complaints 
      GROUP BY status
      ORDER BY count DESC
    `);

    // Get recent activities (latest 10 cases)
    const [recentActivities] = await connection.execute(`
      SELECT 
        c.id,
        c.case_title,
        c.status,
        c.created_at,
        CONCAT(COALESCE(r1.lastname, ''), ', ', COALESCE(r1.firstname, ''), ' ', COALESCE(r1.middlename, '')) as complainant_name,
        CONCAT(COALESCE(r2.lastname, ''), ', ', COALESCE(r2.firstname, ''), ' ', COALESCE(r2.middlename, '')) as respondent_name
      FROM complaints c
      LEFT JOIN residents r1 ON c.complainant_id = r1.id
      LEFT JOIN residents r2 ON c.respondent_id = r2.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    await connection.end();

    // Format monthly data for chart (ensure all 12 months are present)
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = monthlyCases.find(item => item.month === month);
      return {
        month: month,
        count: found ? found.count : 0,
        name: new Date(2024, i, 1).toLocaleString('default', { month: 'short' })
      };
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCases: totalCases[0].count,
          pendingCases: pendingCases[0].count,
          settledCases: settledCases[0].count,
          cfaCases: cfaCases[0].count,
          mediationCases: mediationCases[0].count,
          conciliationCases: conciliationCases[0].count,
          arbitrationCases: arbitrationCases[0].count,
          withdrawnCases: withdrawnCases[0].count,
          referralCases: referralCases[0].count
        },
        monthlyData,
        statusDistribution: statusDistribution.map(item => ({
          name: item.status.replace('_', ' ').toUpperCase(),
          value: item.count,
          status: item.status
        })),
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          title: activity.case_title,
          status: activity.status,
          complainant: activity.complainant_name || 'N/A',
          respondent: activity.respondent_name || 'N/A',
          date: activity.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
};

// Get detailed analytics for admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const connection = await connectDB();

    // Get cases by type (mediation, conciliation, arbitration)
    const [casesByType] = await connection.execute(`
      SELECT 
        CASE 
          WHEN status LIKE '%mediation%' THEN 'Mediation'
          WHEN status LIKE '%conciliation%' THEN 'Conciliation'
          WHEN status LIKE '%arbitration%' THEN 'Arbitration'
          ELSE 'Other'
        END as type,
        COUNT(*) as count
      FROM complaints
      GROUP BY type
    `);

    // Get resolution time statistics
    const [resolutionStats] = await connection.execute(`
      SELECT 
        AVG(DATEDIFF(updated_at, created_at)) as avg_resolution_days,
        MIN(DATEDIFF(updated_at, created_at)) as min_resolution_days,
        MAX(DATEDIFF(updated_at, created_at)) as max_resolution_days
      FROM complaints 
      WHERE status IN ('settled', 'resolved')
        AND updated_at IS NOT NULL
    `);

    await connection.end();

    res.json({
      success: true,
      data: {
        casesByType,
        resolutionStats: resolutionStats[0] || {
          avg_resolution_days: 0,
          min_resolution_days: 0,
          max_resolution_days: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
};

// Get demographics data for admin dashboard
exports.getDemographics = async (req, res) => {
  try {
    const connection = await connectDB();

    // Get highest case types in Lupon
    const [caseTypes] = await connection.execute(`
      SELECT 
        nature_of_case as case_type,
        COUNT(*) as count
      FROM complaints 
      WHERE nature_of_case IS NOT NULL AND nature_of_case != ''
      GROUP BY nature_of_case
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get sitio with highest cases (using purok from residents)
    const [sitioData] = await connection.execute(`
      SELECT 
        r.purok as sitio,
        COUNT(DISTINCT c.id) as case_count
      FROM complaints c
      LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
      WHERE r.purok IS NOT NULL AND r.purok != ''
      GROUP BY r.purok
      ORDER BY case_count DESC
      LIMIT 10
    `);

    // Get barangay breakdown (since gender is not available)
    const [barangayData] = await connection.execute(`
      SELECT 
        r.barangay,
        COUNT(DISTINCT c.id) as case_count
      FROM complaints c
      LEFT JOIN residents r ON (c.complainant_id = r.id OR c.respondent_id = r.id)
      WHERE r.barangay IS NOT NULL AND r.barangay != ''
      GROUP BY r.barangay
      ORDER BY case_count DESC
      LIMIT 10
    `);

    // Get total unique cases for percentage calculation
    const [totalCases] = await connection.execute(`
      SELECT COUNT(*) as total FROM complaints
    `);

    // Get total residents count
    const [totalResidents] = await connection.execute(`
      SELECT COUNT(*) as total FROM residents
    `);

    await connection.end();

    // Format the data for frontend consumption
    const demographics = {
      caseTypes: caseTypes.map(item => ({
        name: item.case_type || 'Unknown',
        count: item.count,
        percentage: totalCases[0].total > 0 ? ((item.count / totalCases[0].total) * 100).toFixed(1) : '0'
      })),
      sitioData: sitioData.map(item => ({
        name: item.sitio || 'Unknown',
        count: item.case_count,
        percentage: totalCases[0].total > 0 ? ((item.case_count / totalCases[0].total) * 100).toFixed(1) : '0'
      })),
      barangayData: barangayData.map(item => ({
        name: item.barangay || 'Unknown',
        count: item.case_count,
        percentage: totalCases[0].total > 0 ? ((item.case_count / totalCases[0].total) * 100).toFixed(1) : '0'
      })),
      totalCases: totalCases[0].total,
      totalResidents: totalResidents[0].total
    };

    res.json({
      success: true,
      data: demographics
    });

  } catch (error) {
    console.error('Error fetching demographics data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch demographics data',
      error: error.message 
    });
  }
};
