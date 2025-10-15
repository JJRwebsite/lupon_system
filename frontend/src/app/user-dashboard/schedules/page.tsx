"use client";
import { useEffect, useState } from "react";
import { EyeIcon, XMarkIcon, CalendarIcon, ClockIcon, UserIcon, UsersIcon, IdentificationIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface Schedule {
  id: number;
  case_no: string;
  complainant: string;
  respondent: string;
  schedule_date: string;
  schedule_time: string;
  case_status: string;
  case_title?: string;
  case_description?: string;
  nature_of_case?: string;
  relief_description?: string;
  date_filed?: string;
  panel_members?: string;
  session_type?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function parsePanelMembers(panelMembersStr?: string): string[] {
  if (!panelMembersStr) return [];
  try {
    const parsed = JSON.parse(panelMembersStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing panel members:', error);
    return [];
  }
}

function ViewScheduleModal({ open, onClose, scheduleData }: { open: boolean, onClose: () => void, scheduleData: any }) {
  if (!open || !scheduleData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-green-200 my-16">
        <div className="flex justify-between items-center px-6 py-4 border-b border-green-100 rounded-t-2xl" style={{ background: '#388e5c' }}>
          <span className="font-semibold text-lg text-white flex items-center gap-2"><CalendarIcon className="h-6 w-6 text-green-200" /> Schedule Details</span>
          <button onClick={onClose} className="hover:bg-[#8dd2aa] rounded-full p-1 transition active:scale-95 sm:active:scale-100"><XMarkIcon className="h-6 w-6 text-white hover:text-green-700" /></button>
        </div>
        <div className="px-6 py-4">
          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Top Left: Case Information */}
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border-l-4 border-green-600">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <IdentificationIcon className="h-5 w-5" /> Case Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Case Number:</span> <span className="text-gray-900">{scheduleData.case_no}</span></div>
                <div><span className="font-medium text-gray-700">Case Title:</span> <span className="text-gray-900">{scheduleData.case_title}</span></div>
                <div><span className="font-medium text-gray-700">Case Nature:</span> <span className="text-gray-900">{scheduleData.nature_of_case || scheduleData.case_nature || 'N/A'}</span></div>
                <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{scheduleData.case_status}</span></div>
                <div><span className="font-medium text-gray-700">Date Filed:</span> <span className="text-gray-900">{formatDate(scheduleData.date_filed)}</span></div>
              </div>
            </div>

            {/* Top Right: Schedule Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <CalendarIcon className="h-5 w-5" /> Schedule Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Schedule Date:</span> <span className="text-gray-900">{formatDate(scheduleData.schedule_date)}</span></div>
                <div><span className="font-medium text-gray-700">Schedule Time:</span> <span className="text-gray-900">{formatTime(scheduleData.schedule_time)}</span></div>
              </div>
            </div>

            {/* Bottom Left: Complainant Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <UserIcon className="h-5 w-5" /> Complainant Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{scheduleData.complainant}</span></div>
              </div>
            </div>

            {/* Bottom Right: Respondent Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <UsersIcon className="h-5 w-5" /> Respondent Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{scheduleData.respondent}</span></div>
              </div>
            </div>
          </div>

          {/* Full-width sections below grid */}
          <div className="space-y-4">
            {/* Case Description */}
            {scheduleData.case_description && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                  <IdentificationIcon className="h-5 w-5" /> Case Description
                </div>
                <div className="text-sm text-gray-900">
                  {scheduleData.case_description}
                </div>
              </div>
            )}

            {/* Relief Description */}
            {scheduleData.relief_description && (
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                  <IdentificationIcon className="h-5 w-5" /> Relief Sought
                </div>
                <div className="text-sm text-gray-900">
                  {scheduleData.relief_description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      // Use the unified schedules API that includes panel members
      const res = await fetch("http://localhost:5000/api/user-dashboard/schedules", { 
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch schedules");
      }
      
      const response = await res.json();
      
      // Debug logging
      console.log('Frontend API Response:', response);
      console.log('Response success:', response.success);
      console.log('Response data length:', response.data ? response.data.length : 'No data');
      if (response.data && response.data.length > 0) {
        console.log('First schedule:', response.data[0]);
      }
      
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch schedules");
      }
      
      // Map the API response to match frontend interface
      const mappedSchedules = response.data.map((schedule: any) => ({
        id: schedule.id,
        case_no: schedule.case_id ? `#${schedule.case_id}` : schedule.case_title || `Case-${schedule.id}`,
        complainant: schedule.complainant_name || 'N/A',
        respondent: schedule.respondent_name || 'N/A',
        schedule_date: schedule.date,
        schedule_time: schedule.time,
        case_status: schedule.session_type,
        case_title: schedule.case_title,
        panel_members: schedule.panel_members,
        session_type: schedule.session_type
      }));
      
      // No additional filtering needed - backend already filters out settled/withdrawn cases
      // The case_status here is actually the session_type (mediation/conciliation/arbitration)
      const activeSchedules = mappedSchedules;
      
      setSchedules(activeSchedules);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    // Fetch current user
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/current-user", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        }
      } catch (e) {
        console.error("Failed to fetch user:", e);
      }
    }
    fetchUser();
    // Poll for real-time schedule updates every 10 seconds
    const interval = setInterval(() => {
      fetchSchedules();
    }, 10000);
    return () => clearInterval(interval);
  }, []);



  const filteredSchedules = schedules.filter(schedule =>
    String(schedule.case_no).toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.complainant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.respondent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.case_status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-8">Loading schedules...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#388e5c] text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        My Schedules
      </div>
      <div className="w-11/12 mx-auto mt-6">

        {/* Schedule Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#388e5c]"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading your schedules...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-3">No Schedules Found</h3>
            <p className="text-gray-500 text-lg">You don't have any upcoming schedules at the moment.</p>
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className="w-full max-w-4xl px-4">
              <div className="space-y-6">
                {filteredSchedules.map((schedule, idx) => (
                  <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                    {/* Card Header */}
                    <div className="bg-[#388e5c] px-6 py-4 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold text-lg">
                          Case #{schedule.case_no}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          schedule.case_status.toLowerCase().includes('mediation') ? 'bg-blue-100 text-blue-800' :
                          schedule.case_status.toLowerCase().includes('conciliation') ? 'bg-purple-100 text-purple-800' :
                          schedule.case_status.toLowerCase().includes('arbitration') ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.case_status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-6">
                      {/* Schedule Info */}
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-5 w-5 text-[#388e5c]" />
                          <div>
                            <p className="text-sm text-gray-600">Date</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatDate(schedule.schedule_date)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <ClockIcon className="h-5 w-5 text-[#388e5c]" />
                          <div>
                            <p className="text-sm text-gray-600">Time</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {formatTime(schedule.schedule_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Case Parties */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Complainant</p>
                            <p className="font-medium text-gray-900">{schedule.complainant}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Respondent</p>
                            <p className="font-medium text-gray-900">{schedule.respondent}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lupon Panel Members - Show only for conciliation and arbitration */}
                      {(schedule.session_type === 'conciliation' || schedule.session_type === 'arbitration') && (() => {
                        const panelMembers = parsePanelMembers(schedule.panel_members);
                        return panelMembers.length > 0 ? (
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <UsersIcon className="h-5 w-5 text-[#388e5c]" />
                              <p className="text-sm font-semibold text-gray-700">Assigned Lupon Panel</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {panelMembers.map((member, index) => (
                                <div key={index} className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#388e5c] rounded-full flex items-center justify-center">
                                      <span className="text-white text-xs font-semibold">
                                        {member.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                      </span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800">{member}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 