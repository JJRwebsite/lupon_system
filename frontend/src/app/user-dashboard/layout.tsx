"use client";
import { useEffect, useState } from "react";
import { ChartBarIcon, DocumentTextIcon, CalendarIcon, ArrowLeftOnRectangleIcon, FolderPlusIcon, CameraIcon, Cog6ToothIcon, ClockIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import NotificationBell from "../../components/NotificationBell";

const navLinks = [
  { label: "Dashboard", icon: ChartBarIcon, href: "/user-dashboard" },
  { label: "File a Case", icon: FolderPlusIcon, href: "/user-dashboard/file-a-case" },
  { label: "My Case", icon: DocumentTextIcon, href: "/user-dashboard/my-case" },
  { label: "Schedules", icon: CalendarIcon, href: "/user-dashboard/schedules" },
  { label: "Settings", icon: Cog6ToothIcon, href: "/user-dashboard/settings" },
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

function getFormattedUserName(user: any) {
  if (!user) return "";
  const first = user.first_name || user.firstName || "";
  const middle = user.middle_name || user.middleName || "";
  const last = user.last_name || user.lastName || "";
  const middleInitial = middle ? middle.charAt(0).toUpperCase() : "";
  
  if (last && first) {
    return middleInitial ? `${last.toUpperCase()}, ${first.toUpperCase()} ${middleInitial}.` : `${last.toUpperCase()}, ${first.toUpperCase()}`;
  }
  return "";
}

// Default anonymous user SVG
const AnonymousAvatar = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16">
    <circle cx="20" cy="20" r="20" fill="#D1FAE5" />
    <ellipse cx="20" cy="15" rx="7" ry="7" fill="#6EE7B7" />
    <ellipse cx="20" cy="30" rx="12" ry="7" fill="#6EE7B7" />
  </svg>
);

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  // Prevent browser back navigation while in the user dashboard area
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.pushState(null, "", window.location.href);
    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.go(1);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/current-user", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setProfilePhoto(data.user.profile_photo || null);
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
      // Use replace so dashboard isn't left in history (prevents back after logout)
      router.replace("/login");
    }
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar for desktop */}
      <aside
        className={`
          hidden sm:flex flex-col justify-between h-screen fixed left-0 top-0 z-20 bg-white
          transition-all duration-200
          ${mounted && collapsed ? 'w-24' : 'w-64'}
        `}
      >
        <div>
          {/* Logo and Title Section */}
          <div className={`flex flex-col items-center transition-all duration-200 border-b border-gray-200 ${mounted && collapsed ? 'py-4' : 'py-6'}`}>
            <button
              className="absolute left-2 top-2 p-1 rounded hover:bg-green-100 sm:block hidden z-10"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              {mounted && collapsed ? <Bars3Icon className="h-6 w-6 text-green-700" /> : <XMarkIcon className="h-6 w-6 text-green-700" />}
            </button>
            
            {/* Barangay Logo */}
            <div className={`${mounted && collapsed ? 'w-12 h-12 mt-8' : 'w-16 h-16 mt-6'} rounded-full overflow-hidden border-2 border-green-300 transition-all duration-200`}>
              <img 
                src="/barangay-logo.png.jpg" 
                alt="Barangay Ibabao Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* User Name and Role */}
            {!collapsed && (
              <div className="text-center mt-2">
                <div className="text-sm font-bold text-green-800">{mounted && user ? getFormattedUserName(user) : "Loading..."}</div>
                <div className="text-xs text-green-600">RESIDENT</div>
              </div>
            )}
          </div>
          

          <nav className="mt-6 flex-1">
            <ul className="space-y-1 px-2 sm:px-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className={`flex items-center gap-3 px-2 sm:px-3 py-2 rounded hover:bg-green-50 text-gray-700 transition ${mounted && collapsed ? 'justify-center' : ''}`}> 
                    <link.icon className={`${mounted && collapsed ? 'h-6 w-6' : 'h-5 w-5'} text-green-600${mounted ? ' transition-all duration-200' : ''}`} />
                    {(!mounted || !collapsed) && <span className="text-sm font-medium">{link.label}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={`px-2 sm:px-4 py-4 sm:py-6 border-t ${mounted && collapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} className={`flex items-center gap-3 text-pink-600 hover:text-pink-700 font-semibold w-full ${mounted && collapsed ? 'justify-center' : ''}`}>
            <ArrowLeftOnRectangleIcon className={`${mounted && collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {(!mounted || !collapsed) && 'LOGOUT'}
          </button>
        </div>
      </aside>
      {/* Sidebar for mobile */}
      <div className="sm:hidden">
        <button
          className="fixed top-2 left-2 z-30 p-2 bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
          onClick={() => setMobileOpen(true)}
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-6 w-6 text-green-700" />
        </button>
        {mounted && mobileOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 backdrop-blur-sm bg-white/30 animate-fadeIn" 
              onClick={() => setMobileOpen(false)} 
              style={{ backdropFilter: 'blur(4px)' }}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white h-full flex flex-col justify-between shadow-xl transform transition-all duration-300 ease-out animate-slideInLeft">
              <div>
                <div className="flex flex-col items-center py-10 relative min-h-[160px]">
                  <button
                    className="absolute right-2 top-2 p-1 rounded hover:bg-green-100 z-10 transition-all duration-200 hover:scale-105"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <XMarkIcon className="h-6 w-6 text-green-700" />
                  </button>
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-green-300 mb-3 mt-6 transition-all duration-200">
                    <img 
                      src="/barangay-logo.png.jpg" 
                      alt="Barangay Ibabao Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center mt-2">
                    <div className="text-sm font-bold text-green-800">{mounted && user ? getFormattedUserName(user) : "Loading..."}</div>
                    <div className="text-xs text-green-600">RESIDENT</div>
                  </div>
                </div>
                <nav className="mt-6 flex-1">
                  <ul className="space-y-1 px-4">
                    {navLinks.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-green-50 text-gray-700 transition" onClick={() => setMobileOpen(false)}>
                          <link.icon className="h-5 w-5 text-green-600" />
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
            </div>
          </>
        )}
      </div>
      {/* Mobile Header - Only visible on mobile */}
      <header className="sm:hidden fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu Button and Logo */}
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6 text-green-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-green-300">
                <img 
                  src="/barangay-logo.png.jpg" 
                  alt="Barangay Ibabao Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-sm font-bold text-green-800">LUPON SYSTEM</div>
            </div>
          </div>
          
          {/* Right: Notification Bell */}
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-200
          ${mounted && mobileOpen ? '' : 'ml-0'}
          ${mounted && collapsed ? 'sm:ml-24' : 'sm:ml-64'}
          sm:block pt-16 sm:pt-0
        `}
      >
        {/* Desktop Header - Only visible on desktop */}
        <header className="hidden sm:flex bg-white shadow-sm border-b border-gray-200 px-4 py-3 justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Lupon System</h1>
          </div>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </header>
        
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
} 