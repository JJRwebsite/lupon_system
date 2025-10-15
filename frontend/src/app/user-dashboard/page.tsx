"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { DocumentTextIcon, ClockIcon, CheckCircleIcon, InboxIcon, CalendarIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getCurrentUser, isAuthenticated, makeAuthenticatedRequest, User } from "../../utils/auth";

interface UserStats {
  totalCases: number;
  pendingCases: number;
  settledCases: number;
  mediationSchedules: number;
  totalMediation: number;
  yearlyData: Array<{ month: number; count: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  recentActivities: Array<{
    id: number;
    case_title: string;
    status: string;
    date_filed: string;
    activity_type: string;
  }>;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const statusColors: { [key: string]: string } = {
  'pending': '#f59e0b',
  'ongoing': '#3b82f6',
  'for_mediation': '#8b5cf6',
  'for_conciliation': '#06b6d4',
  'for_arbitration': '#ec4899',
  'settled': '#10b981',
  'resolved': '#059669',
  'withdrawn': '#6b7280'
};

const COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFF7ED', '#EA580C', '#C2410C', '#9A3412'];

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

// Helper functions for status formatting
const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'ongoing':
      return 'bg-blue-100 text-blue-800';
    case 'for_mediation':
      return 'bg-purple-100 text-purple-800';
    case 'for_conciliation':
      return 'bg-cyan-100 text-cyan-800';
    case 'for_arbitration':
      return 'bg-pink-100 text-pink-800';
    case 'settled':
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'withdrawn':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UserDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Hover count modal state (similar to admin dashboard)
  const [showHoverModal, setShowHoverModal] = useState(false);
  const [hoverCard, setHoverCard] = useState<{ label: string; value: number } | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number; arrow: 'up' | 'down' } | null>(null);
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchUserStats();
    fetchCurrentUser();
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
      
      // Role-based access control: Only allow 'user' role
      if (userData.role === 'admin' || userData.role === 'secretary') {
        alert('Access denied. Admin users should use the admin dashboard.');
        window.location.href = '/admin-dashboard';
        return;
      }
      
      if (userData.role !== 'user') {
        alert('Access denied. Invalid user role.');
        window.location.href = '/login';
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      window.location.href = '/login';
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
    const panelWidth = 220; // approximate panel width
    const panelHeight = 76; // approximate panel height
    const centerX = rect.left + rect.width / 2 + window.scrollX;
    let top = rect.top + window.scrollY - gap - panelHeight;
    let arrow: 'up' | 'down' = 'up';
    if (top < window.scrollY + 8) {
      top = rect.bottom + window.scrollY + gap;
      arrow = 'down';
    }
    const minCenter = window.scrollX + 8 + panelWidth / 2;
    const maxCenter = window.scrollX + window.innerWidth - 8 - panelWidth / 2;
    const clampedCenterX = Math.max(minCenter, Math.min(maxCenter, centerX));
    setHoverPos({ top, left: clampedCenterX, arrow });

    hoverTimer.current = window.setTimeout(() => {
      setHoverCard({ label, value });
      setShowHoverModal(true);
    }, 300);
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

  // Make cards clickable similar to admin dashboard
  const handleCardClick = (label: string) => {
    switch (label) {
      case "Total Cases":
        router.push("/user-dashboard/my-case");
        break;
      case "Pending Cases":
        // If filtering is later supported, append ?filter=pending
        router.push("/user-dashboard/my-case");
        break;
      case "Settled Cases":
        // If filtering is later supported, append ?filter=settled
        router.push("/user-dashboard/my-case");
        break;
      case "Upcoming Schedules":
        router.push("/user-dashboard/schedules");
        break;
      case "Total Sessions":
        router.push("/user-dashboard/schedules");
        break;
      default:
        router.push("/user-dashboard");
    }
  };

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('http://localhost:5000/api/user-dashboard/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const getStatCards = (): StatCard[] => {
    if (!stats) return [];
    
    return [
      { label: "Total Cases", value: stats.totalCases, icon: DocumentTextIcon, color: '#388e5c' },
      { label: "Pending Cases", value: stats.pendingCases, icon: ClockIcon, color: '#f59e0b' },
      { label: "Settled Cases", value: stats.settledCases, icon: CheckCircleIcon, color: '#10b981' },
      { label: "Upcoming Schedules", value: stats.mediationSchedules, icon: CalendarIcon, color: '#3b82f6' },
      { label: "Total Sessions", value: stats.totalMediation, icon: InboxIcon, color: '#8b5cf6' },
    ];
  };

  const renderYearlyChart = () => {
    if (!stats?.yearlyData || stats.yearlyData.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      );
    }

    // Transform data to match admin format
    const chartData = stats.yearlyData.map(data => ({
      name: monthNames[data.month - 1],
      count: data.count
    }));
    
    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
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
            fill="#388e5c" 
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderStatusChart = () => {
    if (!stats?.statusDistribution || stats.statusDistribution.length === 0) {
      return (
        <div className="flex items-center justify-center h-32 text-gray-500">
          No data available
        </div>
      );
    }

    // Transform data to match admin format
    const chartData = stats.statusDistribution.map(item => ({
      name: item.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: item.count,
      status: item.status
    }));
    
    return (
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            outerRadius={85}
            fill="#8884d8"
            dataKey="value"
            stroke="#ffffff"
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
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
    );
  };

  if (loading) {
    return (
      <>
        <header className="bg-[#388e5c] text-white py-3 px-8 shadow">
          <h2 className="text-lg font-semibold">Loading...</h2>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#388e5c] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header className="bg-[#388e5c] text-white py-3 px-8 shadow">
          <h2 className="text-lg font-semibold">Dashboard Error</h2>
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchUserStats}
              className="bg-[#388e5c] text-white px-4 py-2 rounded hover:bg-[#2d6b47]"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="bg-[#388e5c] text-white py-3 px-8 shadow">
        <h2 className="text-lg font-semibold">
          Welcome, {user ? `${user.first_name} ${user.last_name}` : 'User'}
        </h2>
      </header>
      <div className="flex-1 p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {getStatCards().map((stat) => (
            <div
              key={stat.label}
              onClick={() => handleCardClick(stat.label)}
              onMouseEnter={(e) => handleGenericMouseEnter(e, stat.label, stat.value)}
              onMouseLeave={handleGenericMouseLeave}
              className="bg-white rounded-lg shadow flex flex-col items-center p-6 border-t-4 cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg"
              style={{ borderColor: stat.color }}
              title={`Go to ${stat.label}`}
            >
              <stat.icon className="h-8 w-8 mb-2" style={{ color: stat.color }} />
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-gray-500 text-sm mt-1 text-center">{stat.label}</div>
            </div>
          ))}
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
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-3 py-1.5">
                <h4 className="text-xs font-semibold">{hoverCard.label}</h4>
                <p className="text-green-100 text-[10px]">Current count</p>
              </div>
              <div className="px-3 py-3 text-center">
                <div className="text-3xl font-extrabold text-green-700">{hoverCard.value}</div>
              </div>
            </div>
          </div>
        )}
        

          
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Recent Activities</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Latest {stats?.recentActivities?.length || 0} cases
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Case Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Activity Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date Filed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {activity.case_title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {formatStatus(activity.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {activity.activity_type || 'Case Filing'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {new Date(activity.date_filed).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No recent activities
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
} 