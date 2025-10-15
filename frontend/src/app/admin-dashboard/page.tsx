"use client";
import { ChartBarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, TrashIcon, UserGroupIcon, InboxIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
import type React from "react";
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getCurrentUser, isAuthenticated, makeAuthenticatedRequest, User } from "../../utils/auth";

interface AdminStats {
  totalCases: number;
  pendingCases: number;
  settledCases: number;
  cfaCases: number;
  mediationCases: number;
  conciliationCases: number;
  arbitrationCases: number;
  withdrawnCases: number;
  referralCases: number;
}

interface MonthlyData {
  month: number;
  count: number;
  name: string;
}

interface StatusDistribution {
  name: string;
  value: number;
  status: string;
}

interface RecentActivity {
  id: number;
  title: string;
  status: string;
  complainant: string;
  respondent: string;
  date: string;
}

interface DemographicItem {
  name: string;
  count: number;
  percentage: string;
}

interface Demographics {
  caseTypes: DemographicItem[];
  sitioData: DemographicItem[];
  barangayData: DemographicItem[];
  totalCases: number;
  totalResidents: number;
}

interface DashboardData {
  stats: AdminStats;
  monthlyData: MonthlyData[];
  statusDistribution: StatusDistribution[];
  recentActivities: RecentActivity[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

// Custom tooltip for pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold" style={{ color: payload[0].color }}>
            {payload[0].value} cases
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [loading, setLoading] = useState(true);
  const [demographicsLoading, setDemographicsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showCfaModal, setShowCfaModal] = useState(false);
  const cfaHoverTimer = useRef<number | null>(null);
  // Generic hover modal for all cards
  const [showHoverModal, setShowHoverModal] = useState(false);
  const [hoverCard, setHoverCard] = useState<{ label: string; value: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number; arrow: 'up' | 'down' } | null>(null);
  const hoverTimer = useRef<number | null>(null);
  // Demographics toggles
  const [showAllCaseTypes, setShowAllCaseTypes] = useState(false);
  const [showAllSitio, setShowAllSitio] = useState(false);
  const [showAllBarangay, setShowAllBarangay] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardData();
    fetchDemographics();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // Check if user is authenticated with JWT
      if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
      }
      
      const userData = await getCurrentUser();
      
      if (!userData) {
        window.location.href = '/login';
        return;
      }
      
      // Role-based access control: Only allow 'admin' or 'secretary' roles
      if (userData.role === 'user') {
        alert('Access denied. Regular users should use the user dashboard.');
        window.location.href = '/user-dashboard';
        return;
      }
      
      if (userData.role !== 'admin' && userData.role !== 'secretary') {
        alert('Access denied. Invalid admin role.');
        window.location.href = '/login';
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      window.location.href = '/login';
    }
  };

  // Show CFA modal on long hover
  const handleCfaMouseEnter = () => {
    if (cfaHoverTimer.current) {
      clearTimeout(cfaHoverTimer.current);
    }
    cfaHoverTimer.current = window.setTimeout(() => {
      setShowCfaModal(true);
    }, 600); // 600ms hover delay
  };

  const handleCfaMouseLeave = () => {
    if (cfaHoverTimer.current) {
      clearTimeout(cfaHoverTimer.current);
      cfaHoverTimer.current = null;
    }
  };

  // Generic hover handlers (open on hover after delay, close on leave)
  const handleGenericMouseEnter = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    label: string,
    value: number
  ) => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const gap = 8;
    const panelWidth = 220; // approximate panel width (smaller)
    const panelHeight = 76; // approximate panel height (smaller)
    // Center horizontally over the card
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    // Prefer above
    let top = rect.top + window.scrollY - gap - panelHeight;
    let arrow: 'up' | 'down' = 'up';
    if (top < window.scrollY + 8) {
      // Not enough space above, place below
      top = rect.bottom + window.scrollY + gap;
      arrow = 'down';
    }
    // Clamp horizontally with center alignment
    const minCenter = window.scrollX + 8 + panelWidth / 2;
    const maxCenter = window.scrollX + window.innerWidth - 8 - panelWidth / 2;
    const clampedCenterX = Math.max(minCenter, Math.min(maxCenter, centerX));
    setHoverPos({ top, left: clampedCenterX, arrow });

    hoverTimer.current = window.setTimeout(() => {
      setHoverCard({ label, value });
      setShowHoverModal(true);
    }, 300); // Reduced hover delay from 600ms to 300ms
  };

  const handleGenericMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setShowHoverModal(false);
    setHoverCard(null);
    setHoverPos(null);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('http://localhost:5000/api/admin-dashboard/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
        setError(null);
      } else {
        throw new Error(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemographics = async () => {
    try {
      setDemographicsLoading(true);
      const response = await makeAuthenticatedRequest('http://localhost:5000/api/admin-dashboard/demographics');

      if (!response.ok) {
        throw new Error('Failed to fetch demographics data');
      }

      const result = await response.json();
      if (result.success) {
        setDemographics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch demographics data');
      }
    } catch (err) {
      console.error('Error fetching demographics data:', err);
    } finally {
      setDemographicsLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'mediation':
        return 'bg-blue-100 text-blue-800';
      case 'conciliation':
        return 'bg-purple-100 text-purple-800';
      case 'arbitration':
        return 'bg-orange-100 text-orange-800';
      case 'settled':
        return 'bg-green-100 text-green-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCardClick = (cardType: string) => {
    switch (cardType) {
      case 'Total Cases':
        router.push('/admin-dashboard/complaints');
        break;
      case 'Mediation':
        router.push('/admin-dashboard/mediation');
        break;
      case 'Conciliation':
        router.push('/admin-dashboard/conciliation');
        break;
      case 'Arbitration':
        router.push('/admin-dashboard/arbitration');
        break;
      case 'Settled Cases':
        router.push('/admin-dashboard/settlement');
        break;
      case 'Withdrawn Cases':
        router.push('/admin-dashboard/withdrawn-cases');
        break;
      case 'Pending Cases':
        router.push('/admin-dashboard/pending-cases');
        break;
      case 'CFA':
        setShowCfaModal(true);
        break;
      case 'Cases for Referral':
        router.push('/admin-dashboard/referrals');
        break;
      default:
        console.log('No navigation defined for:', cardType);
    }
  };

  if (loading) {
    return (
      <>
        <header className="bg-blue-800 text-white py-3 px-8 shadow">
          <h2 className="text-lg font-semibold">Welcome, Admin</h2>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="bg-blue-800 text-white py-3 px-8 shadow">
          <h2 className="text-lg font-semibold">Welcome, Admin</h2>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!dashboardData) {
    return null;
  }

  // Main statistics cards
  const mainStats = [
    { label: "Total Cases", value: dashboardData.stats.totalCases, icon: DocumentTextIcon, color: "#3b82f6" },
    { label: "Mediation", value: dashboardData.stats.mediationCases, icon: InboxIcon, color: "#6366f1" },
    { label: "Conciliation", value: dashboardData.stats.conciliationCases, icon: UserGroupIcon, color: "#06b6d4" },
    { label: "Arbitration", value: dashboardData.stats.arbitrationCases, icon: DocumentTextIcon, color: "#f97316" },
    { label: "Settled Cases", value: dashboardData.stats.settledCases, icon: CheckCircleIcon, color: "#10b981" },
    { label: "Withdrawn Cases", value: dashboardData.stats.withdrawnCases, icon: TrashIcon, color: "#ef4444" },
  ];

  // Special status cards (separated section)
  const statusStats = [
    { label: "Pending Cases", value: dashboardData.stats.pendingCases, icon: ClockIcon, color: "#f59e0b" },
    { label: "CFA", value: dashboardData.stats.cfaCases, icon: UserGroupIcon, color: "#8b5cf6" },
    { label: "Cases for Referral", value: dashboardData.stats.referralCases, icon: DocumentTextIcon, color: "#06b6d4" },
  ];

  return (
    <>
      <header className="bg-blue-800 text-white py-3 px-8 shadow">
        <h2 className="text-lg font-semibold">Welcome, Admin</h2>
      </header>
      <div className="flex-1 p-8 space-y-8 bg-gray-50 min-h-screen">
        {/* Main Statistics Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Case Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {mainStats.map((stat) => (
              <div 
                key={stat.label} 
                className="bg-white rounded-lg shadow flex flex-col items-center p-6 border-t-4 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg" 
                style={{ borderColor: stat.color }}
                onClick={() => handleCardClick(stat.label)}
                onMouseEnter={(e) => handleGenericMouseEnter(e, stat.label, stat.value)}
                onMouseLeave={handleGenericMouseLeave}
              >
                <stat.icon className="h-8 w-8 mb-2" style={{ color: stat.color }} />
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1 text-center">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Status Cards */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Excluded Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statusStats.map((stat) => (
              <div 
                key={stat.label} 
                className="bg-white rounded-lg shadow flex flex-col items-center p-6 border-t-4 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg" 
                style={{ borderColor: stat.color }}
                onClick={() => handleCardClick(stat.label)}
                onMouseEnter={(e) => handleGenericMouseEnter(e, stat.label, stat.value)}
                onMouseLeave={handleGenericMouseLeave}
              >
                <stat.icon className="h-8 w-8 mb-2" style={{ color: stat.color }} />
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1 text-center">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Cases Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Monthly Cases Trend</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{new Date().getFullYear()}</span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dashboardData.monthlyData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Case Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={dashboardData.statusDistribution}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  outerRadius={85}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {dashboardData.statusDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={32}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: '15px',
                    fontSize: '11px'
                  }}
                  formatter={(value, entry) => (
                    <span style={{ color: '#374151', fontWeight: 500 }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Section */}
        {demographicsLoading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading demographics...</span>
            </div>
          </div>
        ) : demographics ? (
          <>
            {/* Demographics Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Demographics Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-blue-600">{demographics.totalCases.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Residents</p>
                    <p className="text-2xl font-bold text-green-600">{demographics.totalResidents.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Highest Case Types */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Highest Cases</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full hidden md:inline">
                    Total {demographics.caseTypes.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllCaseTypes(v => !v)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showAllCaseTypes ? 'Show less' : 'See all'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {(showAllCaseTypes ? demographics.caseTypes : demographics.caseTypes.slice(0, 3)).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.percentage}% of total cases</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{item.count}</p>
                      <p className="text-xs text-gray-500">cases</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sitio with Highest Cases */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Sitio with Most Cases</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 bg-green-100 px-3 py-1 rounded-full hidden md:inline">
                    Total {demographics.sitioData.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllSitio(v => !v)}
                    className="text-sm text-green-600 hover:underline"
                  >
                    {showAllSitio ? 'Show less' : 'See all'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {(showAllSitio ? demographics.sitioData : demographics.sitioData.slice(0, 3)).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.percentage}% of total cases</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{item.count}</p>
                      <p className="text-xs text-gray-500">cases</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Barangay Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Barangay Breakdown</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 bg-purple-100 px-3 py-1 rounded-full hidden md:inline">
                    Total {demographics.barangayData.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllBarangay(v => !v)}
                    className="text-sm text-purple-600 hover:underline"
                  >
                    {showAllBarangay ? 'Show less' : 'See all'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {(showAllBarangay ? demographics.barangayData : demographics.barangayData.slice(0, 3)).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.percentage}% of total cases</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{item.count}</p>
                      <p className="text-xs text-gray-500">cases</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>
        ) : null}
                
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Recent Activities</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Latest {dashboardData.recentActivities.length} cases
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Case Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Complainant</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Respondent</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {activity.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {activity.complainant || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {activity.respondent || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {formatStatus(activity.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Hover info panel positioned beside the hovered card */}
        {showHoverModal && hoverCard && hoverPos && (
          <div className="fixed z-50 pointer-events-none" style={{ top: hoverPos.top, left: hoverPos.left, transform: 'translateX(-50%)' }}>
            <div className="relative bg-white rounded-lg shadow-lg w-[220px] overflow-hidden pointer-events-none border border-gray-200">
              {/* Arrow */}
              {hoverPos.arrow === 'up' ? (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-white drop-shadow" />
              ) : (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-white drop-shadow" />
              )}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5">
                <h4 className="text-xs font-semibold">{hoverCard.label}</h4>
                <p className="text-blue-100 text-[10px]">Current count</p>
              </div>
              <div className="px-3 py-3 text-center">
                <div className="text-3xl font-extrabold text-blue-700">{hoverCard.value}</div>
              </div>
            </div>
          </div>
        )}
        {/* CFA Count Modal */}
        {showCfaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCfaModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold">Certificate of Final Award (CFA)</h3>
                <p className="text-indigo-100 text-sm">Total number of CFA files</p>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Current count</p>
                  <div className="text-5xl font-extrabold text-indigo-700">
                    {dashboardData?.stats.cfaCases ?? 0}
                  </div>
                </div>
                <div className="mt-6 flex justify-center">
                  <button
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    onClick={() => setShowCfaModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}