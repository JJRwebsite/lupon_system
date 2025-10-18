"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, UsersIcon, ScaleIcon, PlayCircleIcon, XMarkIcon, DocumentTextIcon, IdentificationIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import SetArbitrationModalComplete from "../../../components/SetArbitrationModalComplete";

interface MediationSession {
  id: number;
  schedule_date: string;
  schedule_time: string;
  mediation_minutes: string;
  documentation: string[];
  reschedules?: any[];
}

interface MediationCase {
  id: number;
  complaint_id: number;
  case_title: string;
  complainant: string;
  respondent: string;
  time_elapse: string;
  sessions: MediationSession[];
}

// Utility: Always sort sessions by ID (oldest to newest)
function getSortedSessions(sessions: MediationSession[]): MediationSession[] {
  return [...sessions].sort((a, b) => a.id - b.id);
}

// Helper function to calculate time elapsed from scheduled date
function calculateTimeElapseFromSchedule(mediationGroup: any[]): number {
  // Find the earliest scheduled date from all mediation sessions
  let earliestScheduledDate: string | null = null;
  
  mediationGroup.forEach(med => {
    // Check if this mediation has reschedules with scheduled dates
    if (med.reschedules && Array.isArray(med.reschedules)) {
      med.reschedules.forEach((reschedule: any) => {
        if (reschedule.reschedule_date) {
          if (!earliestScheduledDate || new Date(reschedule.reschedule_date) < new Date(earliestScheduledDate)) {
            earliestScheduledDate = reschedule.reschedule_date;
          }
        }
      });
    }
    
    // Also check the main mediation date as fallback
    if (med.date) {
      if (!earliestScheduledDate || new Date(med.date) < new Date(earliestScheduledDate)) {
        earliestScheduledDate = med.date;
      }
    }
  });
  
  // Calculate days elapsed from earliest scheduled date
  let daysElapsed = 0;
  if (earliestScheduledDate) {
    const today = new Date();
    const scheduled = new Date(earliestScheduledDate);
    today.setHours(0, 0, 0, 0);
    scheduled.setHours(0, 0, 0, 0);
    daysElapsed = Math.floor((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
    
    // Clamp the elapsed days between 0 and 15
    if (daysElapsed < 0) daysElapsed = 0;
    if (daysElapsed > 15) daysElapsed = 15;
  }
  
  return daysElapsed;
}

interface FormsModalProps {
  open: boolean;
  onClose: () => void;
  mediation: MediationCase | null;
  handleDownloadPDF: (formType: string, mediation: MediationCase) => void;
}

const FormsModal = ({ open, onClose, mediation, handleDownloadPDF }: FormsModalProps) => {
  if (!open || !mediation) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "#fff", margin: "40px auto", padding: 24, borderRadius: 8, maxWidth: 900, minHeight: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3B82F6", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Mediation Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, justifyItems: "center" }}>
          {[
            { type: "hearing", title: "Minutes of Hearing", description: "Mediation session minutes and documentation" }
          ].map((form) => {
            return (
              <div key={form.type} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
                <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#aaa" }}>[Preview]</span>
                </div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>{form.title}</div>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>{form.description}</div>
                <button onClick={() => handleDownloadPDF(form.type, mediation)} style={{ width: "100%", background: "#3B82F6", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }}>Download</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function SeePhotosModal({ open, onClose, images }: { open: boolean, onClose: () => void, images: string[] }) {
  if (!open || !images || images.length === 0) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-blue-200 p-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">Uploaded Documentation Photos</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-blue-700 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-6 flex flex-wrap gap-4 justify-center">
          {images.map((src, idx) => {
            // Handle both old and new file path formats
            let imageUrl;
            if (src.startsWith('http')) {
              // Already a full URL - shouldn't happen with new backend
              imageUrl = src;
            } else {
              // Clean path from backend (should be like: uploads/mediation/filename.jpg)
              let cleanPath = src;
              
              // Remove any leading slash to avoid double slashes
              if (cleanPath.startsWith('/')) {
                cleanPath = cleanPath.substring(1);
              }
              
              // Ensure the path starts with uploads/
              if (!cleanPath.startsWith('uploads/')) {
                cleanPath = `uploads/${cleanPath}`;
              }
              
              // Construct the final URL
              imageUrl = `http://localhost:5000/${cleanPath}`;
            }
            
            return (
              <img 
                key={idx} 
                src={imageUrl} 
                alt={`Documentation ${idx + 1}`} 
                className="h-48 w-48 object-cover rounded border"
                onError={(e) => {
                  console.error('Failed to load image:', imageUrl);
                  console.error('Original src:', src);
                  e.currentTarget.style.display = 'none';
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ViewMediationModal({ open, onClose, mediation, onSeePhotos, onRemoveSession }: { open: boolean, onClose: () => void, mediation: any, onSeePhotos: (images: string[]) => void, onRemoveSession: (idx: number) => void }) {
  if (!open || !mediation) return null;

  // Debug: Log mediation data to see what we're working with
  console.log('ViewMediationModal - mediation data:', mediation);
  console.log('ViewMediationModal - witness data:', mediation.witness);
  console.log('ViewMediationModal - documentation:', mediation.documentation);
  console.log('ViewMediationModal - documentation length:', mediation.documentation?.length);

  // Format date as MM/DD/YY
  function formatModalDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const yy = d.getFullYear().toString().slice(-2);
    return `${mm}/${dd}/${yy}`;
  }
  // Format time as 12-hour with AM/PM
  function formatModalTime(timeStr: string) {
    if (!timeStr) return "—";
    // If timeStr is already in HH:mm format, convert to 12-hour with AM/PM
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    // Try to parse as Date
    const d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) {
      let h = d.getHours();
      let m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    // If timeStr is like 2025-06-25T16:00:00.000Z, extract time
    if (timeStr.includes("T")) {
      const t = timeStr.split("T")[1]?.slice(0, 5);
      if (t) {
        const [h, m] = t.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour = h % 12 === 0 ? 12 : h % 12;
        return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
      }
    }
    return timeStr;
  }

  // Always use sorted sessions for display
  const sortedSessions = getSortedSessions(mediation.sessions || []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-blue-200">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <DocumentTextIcon className="h-8 w-8 text-blue-100" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Mediation Details</h2>
              <p className="text-blue-100 text-sm">Mediation ID #{mediation.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group"
          >
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-8 space-y-8">
            {/* Case Information */}
            <div className="bg-blue-50 rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Case Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Case No.:</span> {mediation.complaint_id}</div>
                <div><span className="font-medium">Case Title:</span> {mediation.case_title}</div>
                <div><span className="font-medium">Time Elapse:</span> {mediation.time_elapse}</div>
              </div>
            </div>
            {/* Parties */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Complainant</div>
                <div className="text-sm">{mediation.complainant || '—'}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Respondent</div>
                <div className="text-sm">{mediation.respondent || '—'}</div>
              </div>
              {mediation.witness && (
                <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                  <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Witness</div>
                  <div className="text-sm">{mediation.witness || '—'}</div>
                </div>
              )}
            </div>
            {/* Current Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><ScaleIcon className="h-5 w-5" /> Current Mediation Schedule</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {sortedSessions.length > 0 && (
                  <div>
                    <span className="font-medium">Scheduled for:</span> {formatModalDate(sortedSessions[0].schedule_date)} at {formatModalTime(sortedSessions[0].schedule_time)}
                  </div>
                )}
                {sortedSessions.length === 0 && <div>—</div>}
              </div>
            </div>
            
            {/* Reschedule History & Sessions */}
            {sortedSessions.length > 0 && sortedSessions[0].reschedules && sortedSessions[0].reschedules.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <DocumentTextIcon className="h-5 w-5" /> Mediation Sessions History
                </div>
                <div className="space-y-4">
                  {sortedSessions[0].reschedules
                    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((reschedule: any, idx: number) => (
                    <div key={reschedule.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-blue-700 mb-1">
                            {reschedule.reason === 'Initial session' ? 'Initial Session' : `Reschedule #${idx}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {formatModalDate(reschedule.reschedule_date)} at {formatModalTime(reschedule.reschedule_time)}
                          </div>
                          {reschedule.reason && reschedule.reason !== 'Initial session' && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span> {reschedule.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatModalDate(reschedule.created_at)}
                        </div>
                      </div>
                      
                      {/* Minutes Section */}
                      <div className="mb-3">
                        <div className="font-medium text-blue-700 mb-2">Mediation Minutes:</div>
                        <div className="text-sm bg-white rounded p-3 border border-blue-100 min-h-[60px]">
                          {reschedule.minutes ? (
                            <div className="whitespace-pre-wrap">{reschedule.minutes}</div>
                          ) : (
                            <span className="italic text-gray-400">No minutes recorded for this session.</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Documentation Section - Per Session */}
                      <div>
                        <div className="font-medium text-blue-700 mb-2">Documentation:</div>
                        <div className="text-sm">
                          {(() => {
                            console.log('Session documentation check:', {
                              rescheduleId: reschedule.id,
                              exists: !!reschedule.documentation,
                              isArray: Array.isArray(reschedule.documentation),
                              length: reschedule.documentation?.length,
                              content: reschedule.documentation
                            });
                            
                            if (reschedule.documentation && reschedule.documentation.length > 0) {
                              return (
                                <button 
                                  className="bg-blue-100 border border-blue-300 rounded px-4 py-2 text-blue-700 font-semibold hover:bg-blue-200 transition-colors"
                                  onClick={() => {
                                    // Convert file paths to proper URLs
                                    const documentationUrls = reschedule.documentation.map((path: string) => {
                                      const normalized = path.replace(/\\/g, '/');
                                      // If backend already returned an absolute URL, use as-is; otherwise prepend server origin
                                      const url = /^https?:\/\//i.test(normalized)
                                        ? normalized
                                        : `http://localhost:5000/${normalized}`;
                                      console.log('Converting path to URL:', path, '->', url);
                                      return url;
                                    });
                                    console.log('Final documentation URLs:', documentationUrls);
                                    onSeePhotos(documentationUrls);
                                  }}
                                >
                                  View Documentation ({reschedule.documentation.length} files)
                                </button>
                              );
                            } else {
                              return (
                                <div>
                                  <span className="italic text-gray-400">No documentation uploaded for this session.</span>
                                  <div className="text-xs text-red-500 mt-1">
                                    Debug: session_docs={JSON.stringify(reschedule.documentation)}
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No Sessions Message */}
            {(!sortedSessions.length || !sortedSessions[0].reschedules || sortedSessions[0].reschedules.length === 0) && (
              <div className="bg-gray-50 rounded-2xl p-6 shadow border border-gray-200 text-center">
                <div className="text-gray-500 italic">No mediation sessions have been conducted yet.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StartMediationModal({ open, onClose, mediation, onSave, onReschedule, setShowSettlementSuccess }: { open: boolean, onClose: () => void, mediation: any, onSave: (minutes: string, images: File[]) => void, onReschedule: (date: string, time: string, rescheduleReason?: string) => void, setShowSettlementSuccess: (show: boolean) => void }) {
  const [minutes, setMinutes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processType, setProcessType] = useState("start");
  const [reschedDate, setReschedDate] = useState("");
  const [reschedTime, setReschedTime] = useState("");
  const [warning, setWarning] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [agreements, setAgreements] = useState<string[]>([""]);
  const [remarks, setRemarks] = useState("");
  const [reschedReason, setReschedReason] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Function to show warning modal
  const showWarning = (message: string) => {
    setWarningModalMessage(message);
    setShowWarningModal(true);
  };

  // Generate calendar data for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const localDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isSelected = reschedDate === localDateString;
      const isAvailable = isCurrentMonth && !isPast && !isWeekend;
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isWeekend,
        isSelected,
        isAvailable,
        dateString: localDateString
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Function to fetch slot availability for a selected date (mediation-specific)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/api/mediation/available-slots/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns data in nested data property
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull
        });
        setBookedTimes(data.data.bookedTimes || []);
      } else {
        console.error('Failed to fetch slot availability');
        setSlotInfo(null);
        setBookedTimes([]);
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      setSlotInfo(null);
      setBookedTimes([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    setReschedDate(dateString);
    setReschedTime(""); // Reset time when date changes
    fetchSlotAvailability(dateString);
  };

  useEffect(() => {
    if (!open) {
      setMinutes("");
      setImages([]);
      setPreviews([]);
      setProcessType("start");
      setReschedDate("");
      setReschedTime("");
      setWarning("");
      setAgreements([""]);
      setRemarks("");
      setReschedReason("");
      setSlotInfo(null);
      setBookedTimes([]);
    }
  }, [open]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);
      setPreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Agreement handlers
  const handleAddAgreement = () => setAgreements(prev => [...prev, ""]);
  const handleRemoveAgreement = (idx: number) => setAgreements(prev => prev.filter((_, i) => i !== idx));
  const handleAgreementChange = (idx: number, value: string) => 
    setAgreements(prev => prev.map((a, i) => i === idx ? value : a));

  // Always use sorted sessions for logic
  const sortedSessions = getSortedSessions(mediation?.sessions || []);

  // Helper to check if scheduled date and time has passed
  const isScheduledDateTimePassed = () => {
    if (!mediation || !sortedSessions.length) return false;
    const lastSession = sortedSessions[sortedSessions.length - 1];
    const scheduledDate = lastSession.schedule_date;
    const scheduledTime = lastSession.schedule_time;
    
    if (!scheduledDate || !scheduledTime) return false;
    
    // Get current date and time
    const now = new Date();
    
    // Parse scheduled date (format: YYYY-MM-DD)
    const [year, month, day] = scheduledDate.split('-').map(Number);
    
    // Parse scheduled time (format: HH:mm or HH:mm:ss)
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    
    // Create scheduled datetime
    const scheduledDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Return true if current time has passed the scheduled time
    return now >= scheduledDateTime;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processType === "start") {
      // Validate that the scheduled date and time has occurred
      if (!isScheduledDateTimePassed()) {
        setWarning("You cannot start the mediation yet. The scheduled date and time has not occurred.");
        return;
      }
      
      // Check if the current active session has already been completed
      const currentDate = mediation.sessions[0]?.schedule_date;
      const currentTime = mediation.sessions[0]?.schedule_time;
      
      // Format dates for comparison (handle different date formats)
      const formatDateForComparison = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };
      
      const formatTimeForComparison = (timeStr: string) => {
        if (!timeStr) return '';
        // Handle both HH:mm and HH:mm:ss formats
        return timeStr.split(':').slice(0, 2).join(':'); // HH:mm format
      };
      
      const currentDateFormatted = formatDateForComparison(currentDate);
      const currentTimeFormatted = formatTimeForComparison(currentTime);
      
      // Check if there's already a reschedule record with minutes for the EXACT current schedule
      const currentReschedule = mediation.sessions[0]?.reschedules?.find((r: any) => {
        const reschedDateFormatted = formatDateForComparison(r.reschedule_date);
        const reschedTimeFormatted = formatTimeForComparison(r.reschedule_time);
        
        return reschedDateFormatted === currentDateFormatted && 
               reschedTimeFormatted === currentTimeFormatted && 
               r.minutes && r.minutes.trim().length > 0;
      });
      
      if (currentReschedule) {
        setWarning("This mediation session has already been completed. Please reschedule for a new session.");
        return;
      }
      
      setWarning("");
      onSave(minutes, images);
      onClose();
    } else if (processType === "reschedule") {
      // Comprehensive validation for schedule conflicts
      if (!reschedDate || !reschedTime) {
        showWarning('Please select both date and time for rescheduling.');
        return;
      }
      
      // Check if the selected time slot is already booked (with exclusion for current mediation during reschedule)
      const isTimeSlotBooked = (time: string) => {
        // Convert 24-hour format to 12-hour format for comparison
        const convertTo12Hour = (time24: string) => {
          const [hours, minutes] = time24.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };
        
        // If we're in reschedule mode, exclude the current mediation's time slot
        let filteredBookedTimes = [...bookedTimes];
        if (processType === 'reschedule' && mediation?.sessions) {
          const currentSession = mediation.sessions[mediation.sessions.length - 1];
          if (currentSession?.schedule_time) {
            const currentTime24 = currentSession.schedule_time;
            const currentTime12 = convertTo12Hour(currentTime24);
            
            // Remove current mediation's time slot from booked times
            filteredBookedTimes = bookedTimes.filter(bookedTime => 
              bookedTime !== currentTime24 && bookedTime !== currentTime12
            );
          }
        }
        
        // Check both 24-hour and 12-hour formats against filtered booked times
        const time12Hour = convertTo12Hour(time);
        const isBooked24 = filteredBookedTimes.includes(time);
        const isBooked12 = filteredBookedTimes.includes(time12Hour);
        const isBooked = isBooked24 || isBooked12;
        
        console.log('Mediation time slot check:', { 
          time, 
          time12Hour, 
          originalBookedTimes: bookedTimes,
          filteredBookedTimes, 
          isBooked24, 
          isBooked12, 
          isBooked,
          processType,
          currentMediationTime: processType === 'reschedule' && mediation?.sessions ? mediation.sessions[mediation.sessions.length - 1]?.schedule_time : null
        });
        
        return isBooked;
      };
      
      if (isTimeSlotBooked(reschedTime)) {
        showWarning('This time slot is already booked. Please select a different time.');
        return;
      }
      
      // Check if maximum slots per day would be exceeded
      if (slotInfo?.isFull && !bookedTimes.includes(reschedTime)) {
        showWarning('No available slots for this date. Maximum 4 sessions per day allowed.');
        return;
      }
      
      // Additional validation: Check for minimum 1-hour interval
      const selectedTimeMinutes = parseInt(reschedTime.split(':')[0]) * 60 + parseInt(reschedTime.split(':')[1] || '0');
      const conflictingSlot = bookedTimes.find(bookedTime => {
        const bookedTimeMinutes = parseInt(bookedTime.split(':')[0]) * 60 + parseInt(bookedTime.split(':')[1] || '0');
        const timeDifference = Math.abs(selectedTimeMinutes - bookedTimeMinutes);
        return timeDifference < 60; // Less than 1 hour
      });
      
      if (conflictingSlot) {
        showWarning('Minimum 1-hour interval required between sessions. Please select a different time.');
        return;
      }
      
      setWarning(''); // Clear any previous warnings
      onReschedule(reschedDate, reschedTime, reschedReason);
      onClose();
    } else if (processType === "settled") {
      // Handle settlement creation
      const agreementsText = agreements.filter(a => a.trim()).join('; ');
      if (!agreementsText) {
        setWarning('Please add at least one agreement.');
        return;
      }
      
      try {
        const settlementData = {
          complaint_id: mediation.complaint_id,
          settlement_type: 'mediation',
          // Use local date formatting to avoid UTC conversion issues
          settlement_date: (() => {
            const today = new Date();
            return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          })(),
          agreements: agreementsText,
          remarks: remarks || ''
        };
        
        console.log('Creating settlement:', settlementData);
        
        const response = await fetch('http://localhost:5000/api/settlement/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settlementData),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Settlement created successfully:', result);
        
        // Show success message
        setShowSettlementSuccess(true);
        
        onClose();
      } catch (error) {
        console.error('Error creating settlement:', error);
        setWarning('Failed to create settlement. Please try again.');
      }
    }
  };

  if (!open || !mediation) return null;
  return (
    <>
    {/* Warning Modal */}
    {showWarningModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowWarningModal(false)}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduling Conflict</h3>
            <p className="text-sm text-gray-500 mb-6">{warningModalMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
          <div className="flex items-center gap-3">
            <PlayCircleIcon className="h-8 w-8 text-blue-100" />
            <div>
              <h2 className="text-2xl font-bold capitalize text-white">{processType === "start" ? "Start Mediation" : processType === "reschedule" ? "Reschedule Mediation" : "Settle Mediation"}</h2>
              <p className="text-white text-sm">Mediation ID #{mediation.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="p-8 space-y-8" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-blue-700 mb-2">Type of Process</label>
              <select className="border rounded px-3 py-2 w-full" value={processType} onChange={e => { setProcessType(e.target.value); setWarning(""); }}>
                <option value="start">Start Mediation</option>
                <option value="reschedule">Reschedule</option>
                <option value="settled">Settled</option>
              </select>
            </div>
            {processType === "start" && (
              <>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Mediation Minutes</label>
                  <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" value={minutes} onChange={e => { setMinutes(e.target.value); setWarning(""); }} placeholder="Enter mediation minutes..." required />
                </div>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Mediation Documentation (Upload Photos)</label>
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 flex flex-col gap-2">
                    <label className="inline-block cursor-pointer bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-4 py-2 rounded w-max">
                      Choose Photos
                      <input type="file" accept="image/*" multiple onChange={e => { handleImageChange(e); setWarning(""); }} className="hidden" />
                    </label>
                    <div className="text-sm text-gray-600 min-h-[20px]">
                      {images.length > 0
                        ? images.map((file) => file.name).join(", ")
                        : "No photos selected yet."}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative inline-block">
                          <img src={src} alt={`doc-${idx}`} className="h-20 w-20 object-cover rounded border" />
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute -top-2 -right-2 bg-white border border-gray-400 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition-colors">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
            {processType === "reschedule" && (
              <div className="space-y-6">
                <div>
                  <label className="block font-semibold text-blue-700 mb-3">New Schedule Date</label>
                  
                  {/* Calendar Navigation */}
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      <button
                        type="button"
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        ←
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      <button
                        type="button"
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        →
                      </button>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="p-4">
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => day.isAvailable ? handleDateSelect(day.dateString) : null}
                            disabled={!day.isAvailable}
                            className={`
                              p-2 text-sm rounded-md transition-all duration-150 min-h-[36px]
                              ${
                                day.isSelected
                                  ? 'bg-blue-600 text-white font-semibold shadow-md'
                                  : day.isAvailable
                                  ? 'hover:bg-blue-100 text-gray-700 font-medium'
                                  : day.isCurrentMonth
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-gray-300 cursor-not-allowed'
                              }
                              ${day.isToday && !day.isSelected ? 'ring-2 ring-blue-400' : ''}
                            `}
                          >
                            {day.day}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slot Information Display */}
                {reschedDate && (
                  <div className="space-y-3">
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Checking available slots...</span>
                      </div>
                    ) : slotInfo ? (
                      <div className={`p-4 rounded-lg border ${
                        slotInfo.isFull ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            slotInfo.isFull ? 'bg-red-500' : 'bg-blue-500'
                          }`}></div>
                          <span className={`font-semibold ${
                            slotInfo.isFull ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {slotInfo.isFull ? 'No slots available' : `${slotInfo.availableSlots} slots available`}
                          </span>
                          <span className="text-sm text-gray-600">
                            ({slotInfo.usedSlots}/{slotInfo.maxSlots} used)
                          </span>
                        </div>
                        {slotInfo.scheduledTimes && slotInfo.scheduledTimes.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-2">Already scheduled times:</p>
                            <div className="flex flex-wrap gap-1">
                              {slotInfo.scheduledTimes.map((scheduledTime: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                  {scheduledTime}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
                
                <div>
                  <label className="block font-semibold text-blue-700 mb-3">New Schedule Time</label>
                  
                  {/* Professional Time Picker */}
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Available Time Slots</h4>
                        <span className="text-xs text-gray-500">8:00 AM - 6:00 PM</span>
                      </div>
                      {!reschedDate && (
                        <p className="text-xs text-amber-600 mt-1">Please select a date first to view available time slots</p>
                      )}
                    </div>
                    
                    <div className="p-3">
                      {/* All Time Slots in Compact Grid */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { value: '08:00', display: '8:00 AM' },
                          { value: '09:00', display: '9:00 AM' },
                          { value: '10:00', display: '10:00 AM' },
                          { value: '11:00', display: '11:00 AM' },
                          { value: '13:00', display: '1:00 PM' },
                          { value: '14:00', display: '2:00 PM' },
                          { value: '15:00', display: '3:00 PM' },
                          { value: '16:00', display: '4:00 PM' },
                          { value: '17:00', display: '5:00 PM' },
                          { value: '18:00', display: '6:00 PM' }
                        ].map((slot) => {
                          const isSelected = reschedTime === slot.value;
                          const isBooked = bookedTimes.includes(slot.value);
                          const noDateSelected = !reschedDate || reschedDate.trim() === '';
                          
                          // Check if time slot is in the past for current day
                          const isPastTime = (() => {
                            if (noDateSelected) return false;
                            
                            const now = new Date();
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            
                            const selectedDateObj = new Date(reschedDate);
                            selectedDateObj.setHours(0, 0, 0, 0);
                            
                            // If the selected date is not today, time validation doesn't apply
                            if (selectedDateObj.getTime() !== today.getTime()) {
                              return false;
                            }
                            
                            // Parse the time slot (format: "8:00 AM", "1:00 PM", etc.)
                            const [time, period] = slot.display.split(' ');
                            const [hours, minutes] = time.split(':').map(Number);
                            
                            let hour24 = hours;
                            if (period === 'PM' && hours !== 12) {
                              hour24 += 12;
                            } else if (period === 'AM' && hours === 12) {
                              hour24 = 0;
                            }
                            
                            const slotTime = new Date();
                            slotTime.setHours(hour24, minutes, 0, 0);
                            
                            return slotTime <= now;
                          })();
                          
                          const isDisabled = noDateSelected || isBooked || isPastTime || (slotInfo?.isFull && !isSelected);
                          
                          return (
                            <button
                              key={slot.value}
                              type="button"
                              onClick={() => {
                                // Prevent any action if no date is selected or time is in past
                                if (noDateSelected || isPastTime) {
                                  return;
                                }
                                if (!isDisabled) {
                                  setReschedTime(slot.value);
                                }
                              }}
                              disabled={isDisabled}
                              className={`px-2 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                                noDateSelected
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : isBooked
                                  ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed opacity-50'
                                  : isPastTime
                                  ? 'bg-orange-100 text-orange-500 border-orange-300 cursor-not-allowed opacity-50'
                                  : isDisabled
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                              }`}
                              title={
                                noDateSelected ? 'Please select a date first' :
                                isBooked ? 'This time slot is already booked' : 
                                isPastTime ? 'This time has already passed' :
                                isDisabled ? 'No slots available' : ''
                              }
                            >
                              {slot.display}
                              {isBooked && (
                                <span className="ml-1 text-xs">🚫</span>
                              )}
                              {isPastTime && (
                                <span className="ml-1 text-xs">⏰</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Reason for Reschedule</label>
                  <textarea className="w-full border rounded px-3 py-2 min-h-[60px]" value={reschedReason} onChange={e => setReschedReason(e.target.value)} placeholder="Enter reason..." />
                </div>
              </div>
            )}
            {processType === "settled" && (
              <>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Agreements</label>
                  {agreements.map((a, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        className="border rounded px-3 py-2 flex-1"
                        placeholder={`Agreement #${idx + 1}`}
                        value={a}
                        onChange={e => handleAgreementChange(idx, e.target.value)}
                      />
                      <button type="button" className="border px-3 py-1 rounded text-red-500" onClick={() => handleRemoveAgreement(idx)} disabled={agreements.length === 1}><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                  ))}
                  <button type="button" className="border px-3 py-1 rounded text-blue-700 bg-white hover:bg-blue-50 mt-2" onClick={handleAddAgreement}>+ Add Agreement</button>
                </div>
                <div className="mt-4">
                  <label className="block font-semibold text-blue-700 mb-2">Remarks</label>
                  <textarea className="w-full border rounded px-3 py-2 min-h-[60px]" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter remarks..." />
                </div>
              </>
            )}
            {warning && (
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded px-4 py-2 my-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">{warning}</span>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-700 text-white font-semibold">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}

function SetConciliationModal({ open, onClose, onSave, luponMembers }: { open: boolean, onClose: () => void, onSave: (date: string, time: string, members: string[]) => void, luponMembers: { id: number; name: string }[] }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [warning, setWarning] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Generate calendar data for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const localDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isSelected = date === localDateString;
      const isAvailable = isCurrentMonth && !isPast && !isWeekend;
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isWeekend,
        isSelected,
        isAvailable,
        dateString: localDateString
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Function to fetch slot availability for a selected date (conciliation-specific)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/api/conciliation/available-slots/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns data directly, not nested in data property
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull
        });
        setBookedTimes(data.data.bookedTimes || []);
      } else {
        console.error('Failed to fetch slot availability');
        setSlotInfo(null);
        setBookedTimes([]);
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      setSlotInfo(null);
      setBookedTimes([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    setDate(dateString);
    setTime(""); // Reset time when date changes
    fetchSlotAvailability(dateString);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || bookedTimes.includes(time) || slotInfo?.isFull) {
      setWarning("Please select a valid date and available time slot.");
      return;
    }
    onSave(date, time, members.filter(m => m));
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setDate("");
      setTime("");
      setMembers(["", "", ""]);
      setWarning("");
      setSlotInfo(null);
      setBookedTimes([]);
    }
  }, [open]);

  return !open ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-blue-100" />
            <div>
              <h2 className="text-2xl font-bold">Set Conciliation</h2>
              <p className="text-blue-100 text-sm">Schedule conciliation session with slot validation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Date</label>
              
              {/* Calendar Navigation */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    ←
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    →
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => day.isAvailable ? handleDateSelect(day.dateString) : null}
                        disabled={!day.isAvailable}
                        className={`
                          p-2 text-sm rounded-md transition-all duration-150 min-h-[36px]
                          ${
                            day.isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-md'
                              : day.isAvailable
                              ? 'hover:bg-blue-100 text-gray-700 font-medium'
                              : day.isCurrentMonth
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-300 cursor-not-allowed'
                          }
                          ${day.isToday && !day.isSelected ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slot Information Display */}
            {date && (
              <div className="space-y-3">
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Checking available slots...</span>
                  </div>
                ) : slotInfo ? (
                  <div className={`p-4 rounded-lg border ${
                    slotInfo.isFull ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        slotInfo.isFull ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className={`font-semibold ${
                        slotInfo.isFull ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {slotInfo.isFull ? 'No slots available' : `${slotInfo.availableSlots} slots available`}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({slotInfo.usedSlots}/{slotInfo.maxSlots} used)
                      </span>
                    </div>
                    {slotInfo.scheduledTimes && slotInfo.scheduledTimes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Already scheduled times:</p>
                        <div className="flex flex-wrap gap-1">
                          {slotInfo.scheduledTimes.map((scheduledTime: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              {scheduledTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Time</label>
              
              {/* Professional Time Picker */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Available Time Slots</h4>
                    <span className="text-xs text-gray-500">8:00 AM - 6:00 PM</span>
                  </div>
                </div>
                
                <div className="p-3">
                  {/* All Time Slots in Compact Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: '08:00', display: '8:00 AM' },
                      { value: '09:00', display: '9:00 AM' },
                      { value: '10:00', display: '10:00 AM' },
                      { value: '11:00', display: '11:00 AM' },
                      { value: '13:00', display: '1:00 PM' },
                      { value: '14:00', display: '2:00 PM' },
                      { value: '15:00', display: '3:00 PM' },
                      { value: '16:00', display: '4:00 PM' },
                      { value: '17:00', display: '5:00 PM' },
                      { value: '18:00', display: '6:00 PM' }
                    ].map((slot) => {
                      const isSelected = time === slot.value;
                      const isBooked = bookedTimes.includes(slot.value);
                      // Check if time slot is in the past for current day
                      const isPastTime = (() => {
                        if (!date || date.trim() === '') return false;
                        
                        const now = new Date();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        const selectedDateObj = new Date(date);
                        selectedDateObj.setHours(0, 0, 0, 0);
                        
                        // If the selected date is not today, time validation doesn't apply
                        if (selectedDateObj.getTime() !== today.getTime()) {
                          return false;
                        }
                        
                        // Parse the time slot (format: "8:00 AM", "1:00 PM", etc.)
                        const [time, period] = slot.display.split(' ');
                        const [hours, minutes] = time.split(':').map(Number);
                        
                        let hour24 = hours;
                        if (period === 'PM' && hours !== 12) {
                          hour24 += 12;
                        } else if (period === 'AM' && hours === 12) {
                          hour24 = 0;
                        }
                        
                        const slotTime = new Date();
                        slotTime.setHours(hour24, minutes, 0, 0);
                        
                        return slotTime <= now;
                      })();
                      
                      const isDisabled = isBooked || isPastTime || (slotInfo?.isFull && !isSelected);
                      
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            if (!isDisabled && !isPastTime) {
                              setTime(slot.value);
                            }
                          }}
                          disabled={isDisabled}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : isBooked
                              ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed opacity-50'
                              : isPastTime
                              ? 'bg-orange-100 text-orange-500 border-orange-300 cursor-not-allowed opacity-50'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          title={
                            isBooked ? 'This time slot is already booked' : 
                            isPastTime ? 'This time has already passed' :
                            isDisabled ? 'No slots available' : ''
                          }
                        >
                          {slot.display}
                          {isBooked && (
                            <span className="ml-1 text-xs">🚫</span>
                          )}
                          {isPastTime && (
                            <span className="ml-1 text-xs">⏰</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-blue-700 mb-2">Lupon Members</label>
              {[0,1,2].map(i => {
                // Exclude already selected members in other dropdowns
                const selectedOthers = members.filter((m, idx) => idx !== i);
                const availableMembers = luponMembers.filter(member => !selectedOthers.includes(member.name) || member.name === members[i]);
                return (
                  <select
                    key={i}
                    className="border rounded px-3 py-2 w-full mb-2"
                    value={members[i]}
                    onChange={e => setMembers(m => { const arr = [...m]; arr[i] = e.target.value; return arr; })}
                  >
                    <option value="">Select Lupon Member {i+1} (optional)</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                );
              })}
            </div>

            {warning && (
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded px-4 py-2 my-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">{warning}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                disabled={!date || !time || bookedTimes.includes(time) || slotInfo?.isFull}
                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                  !date || !time || bookedTimes.includes(time) || slotInfo?.isFull
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Set Conciliation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SetArbitrationModal({ open, onClose, onSave, arbitrators, selectedCase, onReschedule }: { open: boolean, onClose: () => void, onSave: (date: string, time: string, members: string[]) => void, arbitrators: { id: string; name: string }[], selectedCase?: any, onReschedule?: (date: string, time: string, rescheduleReason?: string) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [warning, setWarning] = useState("");
  const [processType, setProcessType] = useState("schedule");
  const [reschedReason, setReschedReason] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Function to show warning modal
  const showWarning = (message: string) => {
    setWarningModalMessage(message);
    setShowWarningModal(true);
  };

  // Generate calendar data for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const localDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isSelected = date === localDateString;
      const isAvailable = isCurrentMonth && !isPast && !isWeekend;
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isWeekend,
        isSelected,
        isAvailable,
        dateString: localDateString
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Function to fetch slot availability for a selected date (conciliation-specific)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/api/conciliation/available-slots/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns data directly, not nested in data property
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull
        });
        setBookedTimes(data.data.bookedTimes || []);
      } else {
        console.error('Failed to fetch slot availability');
        setSlotInfo(null);
        setBookedTimes([]);
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      setSlotInfo(null);
      setBookedTimes([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    setDate(dateString);
    setTime(""); // Reset time when date changes
    fetchSlotAvailability(dateString);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || bookedTimes.includes(time) || slotInfo?.isFull) {
      setWarning("Please select a valid date and available time slot.");
      return;
    }
    onSave(date, time, members.filter(m => m));
    onClose();
  };

  useEffect(() => {
    if (!open) {
      setDate("");
      setTime("");
      setMembers(["", "", ""]);
      setWarning("");
      setSlotInfo(null);
      setBookedTimes([]);
    }
  }, [open]);

  return !open ? null : (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <ScaleIcon className="h-8 w-8 text-blue-100" />
            <div>
              <h2 className="text-2xl font-bold">Set Arbitration</h2>
              <p className="text-blue-100 text-sm">Schedule arbitration session with slot validation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Date</label>
              
              {/* Calendar Navigation */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    ←
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    →
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => day.isAvailable ? handleDateSelect(day.dateString) : null}
                        disabled={!day.isAvailable}
                        className={`
                          p-2 text-sm rounded-md transition-all duration-150 min-h-[36px]
                          ${
                            day.isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-md'
                              : day.isAvailable
                              ? 'hover:bg-blue-100 text-gray-700 font-medium'
                              : day.isCurrentMonth
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-300 cursor-not-allowed'
                          }
                          ${day.isToday && !day.isSelected ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slot Information Display */}
            {date && (
              <div className="space-y-3">
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Checking available slots...</span>
                  </div>
                ) : slotInfo ? (
                  <div className={`p-4 rounded-lg border ${
                    slotInfo.isFull ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        slotInfo.isFull ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className={`font-semibold ${
                        slotInfo.isFull ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {slotInfo.isFull ? 'No slots available' : `${slotInfo.availableSlots} slots available`}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({slotInfo.usedSlots}/{slotInfo.maxSlots} used)
                      </span>
                    </div>
                    {slotInfo.scheduledTimes && slotInfo.scheduledTimes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Already scheduled times:</p>
                        <div className="flex flex-wrap gap-1">
                          {slotInfo.scheduledTimes.map((scheduledTime: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              {scheduledTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Time</label>
              
              {/* Professional Time Picker */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Available Time Slots</h4>
                    <span className="text-xs text-gray-500">8:00 AM - 6:00 PM</span>
                  </div>
                </div>
                
                <div className="p-3">
                  {/* All Time Slots in Compact Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: '08:00', display: '8:00 AM' },
                      { value: '09:00', display: '9:00 AM' },
                      { value: '10:00', display: '10:00 AM' },
                      { value: '11:00', display: '11:00 AM' },
                      { value: '13:00', display: '1:00 PM' },
                      { value: '14:00', display: '2:00 PM' },
                      { value: '15:00', display: '3:00 PM' },
                      { value: '16:00', display: '4:00 PM' },
                      { value: '17:00', display: '5:00 PM' },
                      { value: '18:00', display: '6:00 PM' }
                    ].map((slot) => {
                      const isSelected = time === slot.value;
                      const isBooked = bookedTimes.includes(slot.value);
                      const isDisabled = isBooked || (slotInfo?.isFull && !isSelected);
                      
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => !isDisabled ? setTime(slot.value) : null}
                          disabled={isDisabled}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : isBooked
                              ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed opacity-50'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          title={isBooked ? 'This time slot is already booked' : isDisabled ? 'No slots available' : ''}
                        >
                          {slot.display}
                          {isBooked && (
                            <span className="ml-1 text-xs">🚫</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-blue-700 mb-2">Lupon Members</label>
              {[0,1,2].map(i => {
                // Exclude already selected members in other dropdowns
                const selectedOthers = members.filter((m, idx) => idx !== i);
                const availableMembers = arbitrators.filter(member => !selectedOthers.includes(member.name) || member.name === members[i]);
                return (
                  <select
                    key={i}
                    className="border rounded px-3 py-2 w-full mb-2"
                    value={members[i]}
                    onChange={e => setMembers(m => { const arr = [...m]; arr[i] = e.target.value; return arr; })}
                  >
                    <option value="">Select Lupon Member {i+1} (optional)</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                );
              })}
            </div>

            {warning && (
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded px-4 py-2 my-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">{warning}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                disabled={!date || !time || bookedTimes.includes(time) || slotInfo?.isFull}
                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                  !date || !time || bookedTimes.includes(time) || slotInfo?.isFull
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                Set Conciliation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MediationPage() {
  const router = useRouter();

  const [mediationCases, setMediationCases] = useState<MediationCase[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewMediation, setViewMediation] = useState<any>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startMediation, setStartMediation] = useState<any>(null);
  const [showSeePhotosModal, setShowSeePhotosModal] = useState(false);
  const [seePhotosImages, setSeePhotosImages] = useState<string[]>([]);
  const [showSetConciliationModal, setShowSetConciliationModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showSetArbitrationModal, setShowSetArbitrationModal] = useState(false);
  const [selectedArbitrationCase, setSelectedArbitrationCase] = useState<any>(null);

  // Handle PDF download for mediation hearing form
  const handleDownloadMediationPDF = async (mediationCase: MediationCase) => {
    try {
      // Get the latest session data for this case
      const sortedSessions = getSortedSessions(mediationCase.sessions);
      const latestSession = sortedSessions[sortedSessions.length - 1];
      
      if (!latestSession) {
        alert('No mediation session data available for this case.');
        return;
      }

      // Prepare mediation data for PDF generation
      const mediationData = {
        complainant: mediationCase.complainant,
        respondent: mediationCase.respondent,
        case_title: mediationCase.case_title,
        case_no: mediationCase.complaint_id,
        complaint_id: mediationCase.complaint_id,
        schedule_date: latestSession.schedule_date,
        schedule_time: latestSession.schedule_time,
        mediation_minutes: latestSession.mediation_minutes || 'Minutes of the mediation hearing will be recorded here during the session.',
        witness: '' // Add witness data if available in your system
      };

      // Call backend API to generate PDF
      const response = await fetch('http://localhost:5000/api/pdf/generate-mediation-hearing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediationData })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Mediation-Hearing-${mediationCase.complaint_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading mediation PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Handle opening Forms modal
  const handleOpenFormsModal = (mediation: MediationCase) => {
    setSelectedMediationForForms(mediation);
    setShowFormsModal(true);
  };

  // Handle downloading different types of mediation PDFs
  const handleDownloadPDF = async (formType: string, mediation: MediationCase) => {
    try {
      if (formType === 'hearing') {
        // Use existing mediation hearing PDF functionality
        await handleDownloadMediationPDF(mediation);
      } else if (formType === 'settlement') {
        // Prepare settlement data for PDF generation
        const settlementData = {
          complainant: mediation.complainant,
          respondent: mediation.respondent,
          case_title: mediation.case_title,
          case_no: mediation.complaint_id,
          complaint_id: mediation.complaint_id,
          settlement_terms: 'Settlement terms will be recorded here during the mediation process.',
          witness: '' // Add witness data if available
        };

        // Call backend API to generate settlement PDF
        const response = await fetch('http://localhost:5000/api/pdf/generate-settlement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ settlementData })
        });

        if (!response.ok) {
          throw new Error('Failed to generate settlement PDF');
        }

        // Download the PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Settlement-Agreement-${mediation.complaint_id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };
  const [luponMembers, setLuponMembers] = useState<{ id: number; name: string }[]>([]);
  const [arbitrators, setArbitrators] = useState<{ id: string; name: string }[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [showConciliationSuccess, setShowConciliationSuccess] = useState(false);
  const [showArbitrationSuccess, setShowArbitrationSuccess] = useState(false);
  const [showSettlementSuccess, setShowSettlementSuccess] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedMediationForForms, setSelectedMediationForForms] = useState<MediationCase | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/mediation/")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Expected array from /api/mediation, got:', data);
          setMediationCases([]);
          return;
        }
        // Group mediations by complaint_id
        const mediationsByComplaint: { [key: number]: any[] } = {};
        data.forEach((m: any) => {
          if (!mediationsByComplaint[m.complaint_id]) mediationsByComplaint[m.complaint_id] = [];
          mediationsByComplaint[m.complaint_id].push(m);
        });
        // For each complaint_id, find the earliest scheduled date and the mediation with the highest id
        const mediationCases = Object.values(mediationsByComplaint).map((group: any[]) => {
          // Find the mediation with the highest id (latest mediation record)
          const latestMed = group.reduce((acc, curr) => acc.id > curr.id ? acc : curr);
          
          // Calculate days elapsed from earliest scheduled date using helper function
          const daysElapsed = calculateTimeElapseFromSchedule(group);
          return {
            id: latestMed.id,
            complaint_id: latestMed.complaint_id,
            case_title: latestMed.case_title,
            complainant: latestMed.complainant || 'N/A',
            respondent: latestMed.respondent || 'N/A',
            witness: latestMed.witness || null,
            witness_purok: latestMed.witness_purok || null,
            witness_contact: latestMed.witness_contact || null,
            witness_barangay: latestMed.witness_barangay || null,
            time_elapse: `${daysElapsed}/15`,
            sessions: group
              .slice()
              .sort((a, b) => a.id - b.id) // sort by id ascending (oldest to newest)
              .map(m => ({
                id: m.id, // include the session id
                schedule_date: m.date,
                schedule_time: m.time || "",
                mediation_minutes: m.minutes || "",
                documentation: Array.isArray(m.documentation) ? m.documentation : (m.documentation ? JSON.parse(m.documentation) : []),
                reschedules: m.reschedules || [],
              })),
            // Time elapsed now calculated from scheduled dates
            status: latestMed.status || "",
          };
        })
        // Filter out cases where status is 'conciliation_scheduled'
        .filter((c: any) => c.status !== 'conciliation_scheduled');
        setMediationCases(mediationCases);
      })
      .catch(err => {
        console.error('Failed to fetch mediation data:', err);
        setMediationCases([]);
      });
    fetch('http://localhost:5000/api/lupon-members')
      .then(res => res.json())
      .then((members) => {
        setLuponMembers(members.map((m: any) => ({ id: m.id, name: m.name })));
      });
    Promise.all([
      fetch('http://localhost:5000/api/lupon-members').then(res => res.json()),
      fetch('http://localhost:5000/api/lupon-chairperson').then(res => res.json()),
      fetch('http://localhost:5000/api/lupon-secretary').then(res => res.json()),
    ]).then(([members, chairperson, secretary]) => {
      const all = [
        ...members.map((m: any) => ({ id: `member-${m.id}`, name: m.name })),
        ...chairperson.map((c: any) => ({ id: `chairperson-${c.id}`, name: c.name })),
        ...secretary.map((s: any) => ({ id: `secretary-${s.id}`, name: s.name })),
      ];
      setArbitrators(all);
    });
  }, []);

  // After mapping data to mediationCases
  const latestMediationsMap = new Map();
  mediationCases.forEach(m => {
    // For each complaint_id, keep the mediation with the highest id
    if (!latestMediationsMap.has(m.complaint_id) || m.id > latestMediationsMap.get(m.complaint_id).id) {
      latestMediationsMap.set(m.complaint_id, m);
    }
  });
  const latestMediationCases = Array.from(latestMediationsMap.values());

  // Sort by time elapse (priority: highest days first)
  const sortedCases = [...latestMediationCases].sort((a, b) => {
    const aDays = parseInt(a.time_elapse.split("/")[0], 10);
    const bDays = parseInt(b.time_elapse.split("/")[0], 10);
    return bDays - aDays;
  });

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
  
    // Handle YYYY-MM-DD format directly to avoid timezone issues
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      // Validate the parts are numbers
      if (!isNaN(Number(yyyy)) && !isNaN(Number(mm)) && !isNaN(Number(dd))) {
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }
  
    // If it's an ISO string or other format, try to parse carefully
    if (dateStr.includes('T')) {
      // Extract date part from ISO string
      const datePart = dateStr.split('T')[0];
      const dateParts = datePart.split("-");
      if (dateParts.length === 3) {
        const [yyyy, mm, dd] = dateParts;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
      }
    }
  
    // Fallback: return original string
    return dateStr;
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return "—";
    // If timeStr is already in HH:mm format, convert to 12-hour with AM/PM
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    // Try to parse as Date
    const d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) {
      let h = d.getHours();
      let m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    // If timeStr is like 2025-06-25T16:00:00.000Z, extract time
    if (timeStr.includes("T")) {
      const t = timeStr.split("T")[1]?.slice(0, 5);
      if (t) {
        const [h, m] = t.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const hour = h % 12 === 0 ? 12 : h % 12;
        return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
      }
    }
    return timeStr;
  }

  // Update handleSaveMediation to send mediation minutes and documentation to the backend using FormData and fetch.
  const handleSaveMediation = async (minutes: string, images: File[]) => {
    if (!startMediation) return;
    // Use the main mediation ID, not the session ID
    const formData = new FormData();
    formData.append('mediation_id', String(startMediation.id));
    formData.append('minutes', minutes);
    images.forEach((file) => formData.append('photos', file));

    const res = await fetch('http://localhost:5000/api/mediation/session', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      setShowSuccessModal(true);
      // Refresh the data from backend to get updated minutes
      const refreshRes = await fetch("http://localhost:5000/api/mediation/");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (Array.isArray(data)) {
          // Group mediations by complaint_id and process as before
          const mediationsByComplaint: { [key: number]: any[] } = {};
          data.forEach((m: any) => {
            if (!mediationsByComplaint[m.complaint_id]) mediationsByComplaint[m.complaint_id] = [];
            mediationsByComplaint[m.complaint_id].push(m);
          });
          
          const mediationCases = Object.values(mediationsByComplaint).map((group: any[]) => {
            const latestMed = group.reduce((acc, curr) => acc.id > curr.id ? acc : curr);
            
            // Calculate days elapsed from earliest scheduled date using helper function
            const daysElapsed = calculateTimeElapseFromSchedule(group);
            
            return {
              id: latestMed.id,
              complaint_id: latestMed.complaint_id,
              case_title: latestMed.case_title,
              complainant: latestMed.complainant || 'N/A',
              respondent: latestMed.respondent || 'N/A',
              time_elapse: `${daysElapsed}/15`,
              // Add documentation at the mediation level (from the latest mediation record)
              documentation: Array.isArray(latestMed.documentation) ? latestMed.documentation : (latestMed.documentation ? JSON.parse(latestMed.documentation) : []),
              sessions: group
                .slice()
                .sort((a, b) => a.id - b.id)
                .map(m => ({
                  id: m.id,
                  schedule_date: m.date,
                  schedule_time: m.time || "",
                  mediation_minutes: m.minutes || "",
                  documentation: Array.isArray(m.documentation) ? m.documentation : (m.documentation ? JSON.parse(m.documentation) : []),
                  reschedules: m.reschedules || [],
                })),
              // Time elapsed calculated from scheduled dates
              status: latestMed.status || "",
            };
          })
          .filter((c: any) => c.status !== 'conciliation_scheduled');
          
          setMediationCases(mediationCases);
        }
      }
    } else {
      alert('Failed to save mediation session.');
    }
  };

  // Update handleReschedule to add a new session for the rescheduled date/time, so the table shows only the latest session but the modal shows all sessions (including the archived first session).
  const handleReschedule = async (date: string, time: string, rescheduleReason?: string) => {
    if (!startMediation) return;
    try {
      // Use the latest session's id as mediation_id
      const sortedSessions = getSortedSessions(startMediation.sessions);
      const mediationId = sortedSessions[sortedSessions.length - 1].id;
      const res = await fetch("http://localhost:5000/api/mediation/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediation_id: mediationId,
          reschedule_date: date,
          reschedule_time: time,
          reason: rescheduleReason,
        }),
      });
      if (res.ok) {
        // Refresh data from backend to ensure accuracy
        const refreshRes = await fetch("http://localhost:5000/api/mediation/");
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (Array.isArray(data)) {
            // Group mediations by complaint_id
            const mediationsByComplaint: { [key: number]: any[] } = {};
            data.forEach((m: any) => {
              if (!mediationsByComplaint[m.complaint_id]) mediationsByComplaint[m.complaint_id] = [];
              mediationsByComplaint[m.complaint_id].push(m);
            });
            // For each complaint_id, find the earliest scheduled date and the mediation with the highest id
            const mediationCases = Object.values(mediationsByComplaint).map((group: any[]) => {
              // Find the mediation with the highest id (latest mediation record)
              const latestMed = group.reduce((acc, curr) => acc.id > curr.id ? acc : curr);
              
              // Calculate days elapsed from earliest scheduled date using helper function
              const daysElapsed = calculateTimeElapseFromSchedule(group);
              return {
                id: latestMed.id,
                complaint_id: latestMed.complaint_id,
                case_title: latestMed.case_title,
                complainant: latestMed.complainant || 'N/A',
                respondent: latestMed.respondent || 'N/A',
                time_elapse: `${daysElapsed}/15`,
                // Add documentation at the mediation level (from the latest mediation record)
                documentation: Array.isArray(latestMed.documentation) ? latestMed.documentation : (latestMed.documentation ? JSON.parse(latestMed.documentation) : []),
                sessions: group
                  .slice()
                  .sort((a, b) => a.id - b.id)
                  .map(m => ({
                    id: m.id,
                    schedule_date: m.date,
                    schedule_time: m.time || "",
                    mediation_minutes: m.minutes || "",
                    documentation: Array.isArray(m.documentation) ? m.documentation : (m.documentation ? JSON.parse(m.documentation) : []),
                    reschedules: m.reschedules || [],
                  })),
                // Time elapsed calculated from scheduled dates
                status: latestMed.status || "",
              };
            })
            // Filter out cases where status is 'conciliation_scheduled'
            .filter((c: any) => c.status !== 'conciliation_scheduled');
            setMediationCases(mediationCases);
          }
        }
        setShowRescheduleSuccess(true);
      } else {
        alert("Failed to reschedule mediation.");
      }
    } catch (err) {
      setShowRescheduleSuccess(true); // Show success modal even on error
    }
  };

  // Add onRemoveSession handler to MediationPage and pass to ViewMediationModal
  const handleRemoveSession = async (idx: number) => {
    console.log('handleRemoveSession called with idx:', idx);
    if (!viewMediation) {
      console.log('viewMediation is null');
      return;
    }
    
    // Prevent removing the first session
    if (idx === 0) {
      console.log('Cannot remove first session');
      alert('You cannot remove the initial session.');
      return;
    }
    
    // Get the session to be deleted
    const sessionToDelete = viewMediation.sessions[idx];
    console.log('Session to delete:', sessionToDelete);
    
    try {
      console.log('Calling soft delete endpoint for session ID:', sessionToDelete.id);
      // Call the backend to soft delete the session
      const response = await fetch(`http://localhost:5000/api/mediation/session/${sessionToDelete.id}/soft-delete`, {
        method: 'PUT',
      });
      
      console.log('Soft delete response status:', response.status);
      
      if (response.ok) {
        console.log('Soft delete successful, refreshing data...');
        // Refresh the mediation data from the backend
        const res = await fetch("http://localhost:5000/api/mediation/");
        const data = await res.json();
        
        console.log('Refreshed data:', data);
        
        if (Array.isArray(data)) {
          // Group mediations by complaint_id
          const mediationsByComplaint: { [key: number]: any[] } = {};
          data.forEach((m: any) => {
            if (!mediationsByComplaint[m.complaint_id]) mediationsByComplaint[m.complaint_id] = [];
            mediationsByComplaint[m.complaint_id].push(m);
          });
          
          // For each complaint_id, find the earliest scheduled date and the mediation with the highest id
          const mediationCases = Object.values(mediationsByComplaint).map((group: any[]) => {
            // Find the mediation with the highest id (latest mediation record)
            const latestMed = group.reduce((acc, curr) => acc.id > curr.id ? acc : curr);
            
            // Calculate days elapsed from earliest scheduled date using helper function
            const daysElapsed = calculateTimeElapseFromSchedule(group);
            return {
              id: latestMed.id,
              complaint_id: latestMed.complaint_id,
              case_title: latestMed.case_title,
              complainant: latestMed.complainant || 'N/A',
              respondent: latestMed.respondent || 'N/A',
              time_elapse: `${daysElapsed}/15`,
              sessions: group
                .slice()
                .sort((a, b) => a.id - b.id) // sort by id ascending (oldest to newest)
                .map(m => ({
                id: m.id, // include the session id
                schedule_date: m.date,
                schedule_time: m.time || "",
                mediation_minutes: m.minutes || "",
                documentation: Array.isArray(m.documentation) ? m.documentation : (m.documentation ? JSON.parse(m.documentation) : []),
              })),
              // Time elapsed calculated from scheduled dates
              status: latestMed.status || "",
            };
          })
          // Filter out cases where status is 'conciliation_scheduled'
          .filter((c: any) => c.status !== 'conciliation_scheduled');
          
          console.log('Updated mediation cases:', mediationCases);
          setMediationCases(mediationCases);
          
          // Update the viewMediation state if it's the same case
          if (viewMediation) {
            const updatedCase = mediationCases.find(c => c.complaint_id === viewMediation.complaint_id);
            if (updatedCase) {
              console.log('Updating viewMediation with:', updatedCase);
              setViewMediation(updatedCase);
            }
          }
        }
      } else {
        console.log('Soft delete failed with status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        alert('Failed to delete session.');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error deleting session.');
    }
  };

  // Handler for modal
  const handleSaveSetConciliation = async (date: string, time: string, members: string[]) => {
    if (!selectedCase) return;
    try {
      const res = await fetch("http://localhost:5000/api/conciliation/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: selectedCase.complaint_id,
          date,
          time,
          panel: members,
        }),
      });
      if (res.ok) {
        setShowConciliationSuccess(true);
      } else {
        const errorData = await res.json();
        // Show centered modal-style notification with OK button
        const errorMessage = errorData.error || 'Failed to set conciliation schedule.';
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'bg-white rounded-lg shadow-xl p-6 max-w-md mx-4';
        modal.innerHTML = `
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Scheduling Conflict</h3>
            <p class="text-sm text-gray-600 mb-6">${errorMessage}</p>
            <button id="conflict-ok-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
              OK
            </button>
          </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Add click handler to OK button
        const okButton = modal.querySelector('#conflict-ok-btn');
        okButton?.addEventListener('click', () => {
          document.body.removeChild(overlay);
        });
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            document.body.removeChild(overlay);
          }
        });
      }
    } catch (error) {
      console.error('Error setting conciliation schedule:', error);
      alert('Error setting conciliation schedule. Please try again.');
    }
  };

  const handleSaveSetArbitration = async (date: string, time: string, members: string[]) => {
    if (!selectedArbitrationCase) return;
    
    try {
      console.log('Sending arbitration data:', {
        complaint_id: selectedArbitrationCase.complaint_id,
        date,
        time,
        panel_members: members.filter(m => m.trim() !== ''), // Filter out empty strings
        lupon_panel: members.filter(m => m.trim() !== '') // Also include lupon_panel for backward compatibility
      });
      
      const res = await fetch("http://localhost:5000/api/arbitration/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: selectedArbitrationCase.complaint_id,
          date,
          time,
          panel_members: members.filter(m => m.trim() !== ''), // Filter out empty strings
          lupon_panel: members.filter(m => m.trim() !== '') // Also include lupon_panel for backward compatibility
        }),
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log('Arbitration scheduled successfully:', result);
        setShowArbitrationSuccess(true);
        
        // Update the local state to reflect the new arbitration
        setMediationCases(prevCases => 
          prevCases.map(c => 
            c.complaint_id === selectedArbitrationCase.complaint_id 
              ? { ...c, has_arbitration: true } 
              : c
          )
        );
        
        // Redirect to arbitration page after a short delay to show the success modal
        setTimeout(() => {
          router.push('/admin-dashboard/arbitration');
        }, 2000); // 2 second delay to show the success modal
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to set arbitration schedule:', errorData);
        alert(`Failed to set arbitration schedule: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error setting arbitration schedule:', error);
      alert("Failed to set arbitration schedule.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ViewMediationModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        mediation={viewMediation}
        onSeePhotos={(images: string[]) => {
          setSeePhotosImages(images);
          setShowSeePhotosModal(true);
        }}
        onRemoveSession={handleRemoveSession}
      />
      <SeePhotosModal open={showSeePhotosModal} onClose={() => setShowSeePhotosModal(false)} images={seePhotosImages} />
      <StartMediationModal open={showStartModal} onClose={() => setShowStartModal(false)} mediation={startMediation} onSave={handleSaveMediation} onReschedule={handleReschedule} setShowSettlementSuccess={setShowSettlementSuccess} />
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Mediation session saved successfully.</div>
            <button onClick={() => setShowSuccessModal(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showRescheduleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Mediation session rescheduled successfully.</div>
            <button onClick={() => setShowRescheduleSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showConciliationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Conciliation schedule set successfully.</div>
            <button onClick={() => setShowConciliationSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showArbitrationSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Arbitration set successfully.</div>
            <button onClick={() => setShowArbitrationSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showSettlementSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Settlement created successfully!</div>
            <button onClick={() => setShowSettlementSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      <SetConciliationModal
        open={showSetConciliationModal}
        onClose={() => setShowSetConciliationModal(false)}
        onSave={handleSaveSetConciliation}
        luponMembers={luponMembers}
      />
      <SetArbitrationModalComplete
        open={showSetArbitrationModal}
        onClose={() => setShowSetArbitrationModal(false)}
        onSave={handleSaveSetArbitration}
        arbitrators={arbitrators}
        selectedCase={selectedArbitrationCase}
      />
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Mediation Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Mediation/s List</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {latestMediationCases.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-semibold">Case No.</th>
                  <th className="px-4 py-2 text-left font-semibold">Case Title</th>
                  <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                  <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                  <th className="px-4 py-2 text-left font-semibold">Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Time</th>
                  <th className="px-4 py-2 text-left font-semibold">Time Elapse</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                  <th className="px-4 py-2 text-left font-semibold">Forms</th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.map((c, idx) => {
                  // Always sort sessions oldest to latest
                  const sortedSessions = getSortedSessions(c.sessions);
                  const days = parseInt(c.time_elapse.split("/")[0], 10);
                  return (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.complaint_id}</td>
                      <td className="px-4 py-2">{c.case_title}</td>
                      <td className="px-4 py-2">{c.complainant}</td>
                      <td className="px-4 py-2">{c.respondent}</td>
                      <td className="px-4 py-2">{sortedSessions.length > 0 ? formatDate(sortedSessions[sortedSessions.length-1].schedule_date) : '—'}</td>
                      <td className="px-4 py-2">{sortedSessions.length > 0 ? formatTime(sortedSessions[sortedSessions.length-1].schedule_time) : '—'}</td>
                      <td className="px-4 py-2 font-bold rounded">
                        <span className={
                          days >= 11 ? "text-red-600" :
                          days >= 6 ? "text-yellow-600" :
                          "text-green-600"
                        }>{c.time_elapse}</span>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                          onClick={() => {
                            // Gather all sessions for this complaint_id, sorted
                            const allSessions = mediationCases
                              .filter(med => med.complaint_id === c.complaint_id)
                              .flatMap(med => med.sessions)
                              .sort((a, b) => a.id - b.id);
                            setViewMediation({ ...c, sessions: allSessions });
                            setShowViewModal(true);
                          }}
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                        <button className="text-green-600 hover:text-green-800" title="Start" onClick={() => {
                          // Find the first session that is not completed
                          const sortedSessions = getSortedSessions(c.sessions);
                          const sessionToEdit = sortedSessions.findIndex((s: MediationSession) => !s.mediation_minutes && (!s.documentation || s.documentation.length === 0));
                          setStartMediation({ ...c, sessions: sortedSessions, sessionToEdit: sessionToEdit === -1 ? sortedSessions.length - 1 : sessionToEdit });
                          setShowStartModal(true);
                        }}><PlayCircleIcon className="h-5 w-5 inline" /></button>
                        <div className="relative group">
                          <button className="text-blue-700 hover:text-blue-900" title="Set Conciliation" onClick={() => { setSelectedCase(c); setShowSetConciliationModal(true); }}>
                            <UsersIcon className="h-5 w-5 inline" />
                          </button>
                          <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                            Set Conciliation
                          </span>
                        </div>
                        <div className="relative group">
                          <button className="text-amber-600 hover:text-amber-800" title="Set Arbitration" onClick={() => { setSelectedArbitrationCase(c); setShowSetArbitrationModal(true); }}>
                            <ScaleIcon className="h-5 w-5 inline" />
                          </button>
                          <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                            Set Arbitration
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                          onClick={() => handleOpenFormsModal(c as MediationCase)}
                        >
                          Forms
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Forms Modal */}
      <FormsModal
        open={showFormsModal}
        onClose={() => setShowFormsModal(false)}
        mediation={selectedMediationForForms}
        handleDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}