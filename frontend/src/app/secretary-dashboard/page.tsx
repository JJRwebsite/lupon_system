"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartBarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, TrashIcon, UserGroupIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon, InboxIcon } from "@heroicons/react/24/outline";

const stats = [
  { label: "Total Cases", value: 10, icon: DocumentTextIcon },
  { label: "Pending Cases", value: 12, icon: ClockIcon },
  { label: "Settled Cases", value: 8, icon: CheckCircleIcon },
  { label: "CFA", value: 5, icon: UserGroupIcon },
  { label: "Mediation", value: 8, icon: InboxIcon },
  { label: "Withdrawn Cases", value: 10, icon: TrashIcon },
];

const navLinks = [
  { label: "Dashboard", icon: ChartBarIcon },
  { label: "Pending Cases", icon: ClockIcon },
  { label: "Complaint", icon: DocumentTextIcon },
  { label: "Withdraw Cases", icon: TrashIcon },
  { label: "Mediation", icon: InboxIcon },
  { label: "Conciliation", icon: UserGroupIcon },
  { label: "Arbitration", icon: UserGroupIcon },
  { label: "Settlement", icon: CheckCircleIcon },
  { label: "Reports", icon: ChartBarIcon },
  { label: "Settings", icon: Cog6ToothIcon },
];

function getInitials(user: any) {
  if (!user) return "";
  const first = user.first_name || user.firstName || "";
  const last = user.last_name || user.lastName || "";
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getFullName(user: any) {
  if (!user) return "";
  const first = user.first_name || user.firstName || "";
  const middle = user.middle_name || user.middleName || "";
  const last = user.last_name || user.lastName || "";
  return [first, middle, last].filter(Boolean).join(" ").toUpperCase();
}

export default function SecretaryDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/current-user", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await fetch("http://localhost:5000/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      // Optionally handle error
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col justify-between min-h-screen">
        <div>
          <div className="flex flex-col items-center py-8 border-b">
            <div className="w-20 h-20 rounded-full bg-pink-200 flex items-center justify-center text-3xl font-bold text-pink-700 mb-2">
              {loading ? "..." : getInitials(user)}
            </div>
            <div className="font-semibold text-lg text-center">
              {loading ? "Loading..." : getFullName(user)}
            </div>
          </div>
          <nav className="mt-6 flex-1">
            <ul className="space-y-1 px-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href="#" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-pink-50 text-gray-700 transition">
                    <link.icon className="h-5 w-5 text-pink-600" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="px-4 py-6 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 text-pink-600 hover:text-pink-700 font-semibold w-full">
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            LOGOUT
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-pink-700 text-white py-3 px-8 shadow">
          <h2 className="text-lg font-semibold">Welcome, Secretary</h2>
        </header>
        {/* Dashboard Content */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stat Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg shadow flex flex-col items-center p-6">
                <stat.icon className="h-8 w-8 text-pink-600 mb-2" />
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                <div className="text-gray-500 text-sm mt-1 text-center">{stat.label}</div>
              </div>
            ))}
          </div>
          {/* Charts */}
          <div className="lg:row-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-lg shadow p-4 flex-1 min-h-[220px]">
              <div className="font-semibold text-gray-700 mb-2">Yearly Cases</div>
              <div className="h-40 flex items-center justify-center text-gray-400">[Bar Chart Placeholder]</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex-1 min-h-[220px]">
              <div className="font-semibold text-gray-700 mb-2">Case Distribution</div>
              <div className="h-40 flex items-center justify-center text-gray-400">[Pie Chart Placeholder]</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 