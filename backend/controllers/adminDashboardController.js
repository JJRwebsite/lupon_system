const connectDB = require('../config/db');
const {
  getAdminStatsData,
  getAdminAnalyticsData,
  getDemographicsData,
} = require('../models/adminDashboardModel');

// Get admin dashboard statistics
exports.getAdminStats = async (req, res) => {
  const connection = await connectDB();
  try {
    const data = await getAdminStatsData(connection);
    res.json({ success: true, data: {
      stats: data.stats,
      monthlyData: data.monthlyData,
      statusDistribution: data.statusDistribution,
      recentActivities: data.recentActivities,
    }});
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get detailed analytics for admin
exports.getAdminAnalytics = async (req, res) => {
  const connection = await connectDB();
  try {
    const data = await getAdminAnalyticsData(connection);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  } finally {
    await connection.end();
  }
};

// Get demographics data for admin dashboard
exports.getDemographics = async (req, res) => {
  const connection = await connectDB();
  try {
    const data = await getDemographicsData(connection);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching demographics data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch demographics data', error: error.message });
  } finally {
    await connection.end();
  }
};
