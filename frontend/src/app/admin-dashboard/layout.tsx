"use client";
import { useEffect, useState } from "react";
import { ChartBarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, TrashIcon, UserGroupIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon, InboxIcon, ArrowTopRightOnSquareIcon, Bars3Icon, XMarkIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, isAuthenticated } from "../../utils/auth";

const navLinks = [
  { label: "Dashboard", icon: ChartBarIcon, href: "/admin-dashboard" },
  { label: "Cases for Approval", icon: ClockIcon, href: "/admin-dashboard/pending-cases" },
  { label: "Complaints", icon: DocumentTextIcon, href: "/admin-dashboard/complaints" },
  { label: "Cases For Refferal", icon: ArrowTopRightOnSquareIcon, href: "/admin-dashboard/referrals" },
  { label: "Withdraw Cases", icon: TrashIcon, href: "/admin-dashboard/withdrawn-cases" },
  { label: "Mediation", icon: InboxIcon, href: "/admin-dashboard/mediation" },
  { label: "Conciliation", icon: UserGroupIcon, href: "/admin-dashboard/conciliation" },
  { label: "Arbitration", icon: ScaleIcon, href: "/admin-dashboard/arbitration" },
  { label: "Settlement", icon: CheckCircleIcon, href: "/admin-dashboard/settlement" },
  { label: "Reports", icon: ChartBarIcon, href: "/admin-dashboard/reports" },
  { label: "Settings", icon: Cog6ToothIcon, href: "/admin-dashboard/settings" },
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

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  const router = useRouter();

  // Prevent browser back navigation while in the admin area
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Push a new state so that immediate back tries to leave this page
    window.history.pushState(null, "", window.location.href);
    const onPopState = (e: PopStateEvent) => {
      e.preventDefault();
      // Immediately negate the back action
      window.history.go(1);
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  // Function to check for unread case approval notifications
  const checkForCaseApprovalNotifications = async () => {
    try {
      const jwtToken = localStorage.getItem('jwt_token');
      if (!jwtToken) return;
      
      const response = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${jwtToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Check if there are any unread case_for_approval notifications
          const hasUnreadCaseApprovalNotifications = data.notifications.some(
            (notif: any) => notif.type === 'case_for_approval' && !notif.is_read
          );
          
          setShowNotificationBadge(hasUnreadCaseApprovalNotifications);
        }
      }
    } catch (error) {
      console.error('Error checking for case approval notifications:', error);
    }
  };

  // Function to handle Cases for Approval click
  const handleCasesForApprovalClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const link = e.currentTarget as HTMLAnchorElement;
    
    try {
      // Hide the badge immediately for better UX
      setShowNotificationBadge(false);
      
      // Get all notifications and mark case_for_approval ones as read
      const response = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Find unread case_for_approval notifications and mark them as read
          const unreadCaseApprovalNotifications = data.notifications.filter(
            (notif: any) => notif.type === 'case_for_approval' && !notif.is_read
          );
          
          // Mark each unread case approval notification as read
          for (const notification of unreadCaseApprovalNotifications) {
            await fetch(`http://localhost:5000/api/notifications/${notification.id}/read`, {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
              }
            });
          }
        }
      }
      
      // Add delay to ensure state updates complete before navigation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Navigate to the page
      window.location.href = link.href;
    } catch (error) {
      console.error('Error handling cases for approval click:', error);
      // Navigate anyway if there's an error
      window.location.href = link.href;
    }
  };

  useEffect(() => {
    setMounted(true);
    
    async function fetchUser() {
      try {
        if (!isAuthenticated()) {
          router.push("/login");
          return;
        }

        const userData = await getCurrentUser();
        if (userData && (userData.role === 'admin' || userData.role === 'secretary')) {
          setUser(userData);
          
          // Generate JWT token if not exists
          const jwtToken = localStorage.getItem('jwt_token');
          if (!jwtToken) {
            try {
              const jwtResponse = await fetch('http://localhost:5000/api/auth/generate-jwt', {
                method: 'POST',
                credentials: 'include'
              });
              
              const jwtData = await jwtResponse.json();
              if (jwtData.success) {
                // Store JWT token in localStorage
                localStorage.setItem('jwt_token', jwtData.token);
                console.log('✅ JWT token generated and stored successfully');
              } else {
                console.error('Failed to generate JWT token:', jwtData.message);
              }
            } catch (error) {
              console.error('Error generating JWT token:', error);
            }
          }
        } else {
          router.push("/login");
        }
      } catch (e) {
        console.error('Error fetching user:', e);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Polling effect to check for case approval notifications every 30 seconds
  useEffect(() => {
    if (user && mounted) {
      // Check immediately when component mounts
      checkForCaseApprovalNotifications();
      
      // Set up polling every 30 seconds
      const interval = setInterval(checkForCaseApprovalNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, mounted]);

  async function handleLogout(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await logout();
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Use replace so admin page isn't left in history (prevents back to admin after logout)
      router.replace("/login");
    }
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden sm:flex flex-col justify-between h-screen fixed left-0 top-0 z-20 bg-white
          transition-all duration-200
          ${collapsed ? 'w-24' : 'w-64'}
        `}
      >
        <div>
          {/* Toggle Button at Top Right */}
          <div className="flex justify-end py-3 px-4">
            <button
              className="p-1 rounded hover:bg-blue-100 sm:block hidden z-10"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
            >
              {collapsed ? <Bars3Icon className="h-6 w-6 text-blue-700" /> : <XMarkIcon className="h-6 w-6 text-blue-700" />}
            </button>
          </div>
          
          {/* Ibabao Logo Section */}
          <div className={`flex justify-center items-center transition-all duration-200 py-4 border-b border-gray-200 px-4 ${collapsed ? 'py-3' : ''}`}>
            <div className={`transition-all duration-200 w-16 h-16 rounded-full overflow-hidden border-2 border-blue-300 shadow-sm flex-shrink-0 ${collapsed ? 'w-12 h-12' : ''}`}>
              <img 
                src="/ibabao.jpg" 
                alt="Barangay Ibabao Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`ml-3 transition-all duration-200 ${collapsed ? 'hidden' : ''}`}>
              <div className="text-sm font-bold text-blue-800">SYSTEM ADMINISTRATOR</div>
            </div>
          </div>
          
          <nav className="mt-6 flex-1">
            <ul className="space-y-1 px-2 sm:px-4">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className={`flex items-center gap-3 px-2 sm:px-3 py-2 rounded hover:bg-blue-50 text-gray-700 transition ${collapsed ? 'justify-center' : ''}`}
                    onClick={link.label === 'Cases for Approval' ? handleCasesForApprovalClick : undefined}
                  >
                    <div className="relative">
                      <link.icon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'} text-blue-600 transition-all duration-200`} />
                      {/* Notification badge for Cases for Approval */}
                      {link.label === 'Cases for Approval' && showNotificationBadge && (
                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full h-3 w-3 animate-pulse">
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-sm font-medium">{link.label}</span>
                      </div>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className={`px-2 sm:px-4 py-4 sm:py-6 border-t ${collapsed ? 'flex justify-center' : ''}`}>
          <button onClick={handleLogout} className={`flex items-center gap-3 text-pink-600 hover:text-pink-700 font-semibold w-full ${collapsed ? 'justify-center' : ''}`}>
            <ArrowLeftOnRectangleIcon className={`${collapsed ? 'h-6 w-6' : 'h-5 w-5'}`} />
            {!collapsed && 'LOGOUT'}
          </button>
        </div>
      </aside>

      {/* Mobile Header and Navigation */}
      <div className="sm:hidden">
        {/* Mobile Top Header */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Menu Button and Logo */}
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-6 w-6 text-blue-700" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-300">
                  <img 
                    src="/ibabao.jpg" 
                    alt="Barangay Ibabao Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-sm font-bold text-blue-800">LUPON ADMIN</div>
              </div>
            </div>
            
            {/* Right: Notification Badge (if any) */}
            <div className="flex items-center">
              {showNotificationBadge && (
                <div className="relative">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setMobileOpen(false)}
            />
            
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-50 w-80 h-screen bg-white shadow-2xl transform transition-transform duration-300 ease-out">
              <div className="flex flex-col h-full">
                {/* Sidebar Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-white/20 shadow-lg">
                        <img 
                          src="/ibabao.jpg" 
                          alt="Barangay Ibabao Logo" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-bold text-base">LUPON SYSTEM</div>
                        <div className="text-blue-100 text-sm">Administrator</div>
                      </div>
                    </div>
                    <button
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close menu"
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>
                
                {/* Navigation Menu */}
                <nav className="flex-1 py-6 overflow-y-auto">
                  <ul className="space-y-2 px-4">
                    {navLinks.map((link) => (
                      <li key={link.label}>
                        <a 
                          href={link.href} 
                          className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-50 text-gray-700 transition-all duration-200 group"
                          onClick={(e) => {
                            setMobileOpen(false);
                            if (link.label === 'Cases for Approval') {
                              handleCasesForApprovalClick(e);
                            }
                          }}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <link.icon className="h-5 w-5 text-blue-600" />
                            </div>
                            {/* Notification badge for Cases for Approval */}
                            {link.label === 'Cases for Approval' && showNotificationBadge && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                              {link.label}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                {/* Logout Section */}
                <div className="border-t bg-gray-50 px-4 py-4">
                  <button 
                    onClick={(e) => {
                      setMobileOpen(false);
                      handleLogout(e);
                    }} 
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold w-full transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                      <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                    </div>
                    <span>LOGOUT</span>
                  </button>
                </div>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-200 ${
        collapsed ? 'sm:ml-24' : 'sm:ml-64'
      } sm:ml-0 pt-16 sm:pt-0`}>
        <div className="flex-1 p-4 sm:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
