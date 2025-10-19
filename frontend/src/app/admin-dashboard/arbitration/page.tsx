"use client";
import { useState, useEffect, ChangeEvent, useCallback } from "react";
import Image from 'next/image';
import { EyeIcon, UsersIcon, ScaleIcon, PlayCircleIcon, XMarkIcon, DocumentTextIcon, IdentificationIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface ArbitrationReschedule {
  id: number;
  reschedule_date: string;
  reschedule_time: string;
  minutes: string;
  documentation: string[];
  reason?: string;
}

interface ArbitrationSession {
  id: number;
  schedule_date: string;
  schedule_time: string;
  arbitration_minutes: string;
  documentation: string[];
  reschedules?: ArbitrationReschedule[];
  reason?: string;
  panel?: string[]; // Array of panel member IDs or names
}

interface ArbitrationCase {
  id: number;
  complaint_id: number;
  case_title: string;
  complainants: string[];
  respondents: string[];
  time_elapse: string;
  sessions: ArbitrationSession[];
  panel_members?: Array<{ id: string | number; name: string }>; // Array of panel members with id and name
}

interface FormsModalProps {
  open: boolean;
  onClose: () => void;
  arbitration: ArbitrationCase | null;
  handleDownloadPDF: (formType: string, arbitration: ArbitrationCase) => void;
}

const FormsModal = ({ open, onClose, arbitration, handleDownloadPDF }: FormsModalProps) => {
  if (!open || !arbitration) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "#fff", margin: "40px auto", padding: 24, borderRadius: 8, maxWidth: 900, minHeight: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid blue", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Arbitration Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, justifyItems: "center" }}>
          {[
            { type: "hearing", title: "Minutes of Hearing", description: "Arbitration session minutes and documentation" }
          ].map((form) => {
            return (
              <div key={form.type} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
                <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#aaa" }}>[Preview]</span>
                </div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>{form.title}</div>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>{form.description}</div>
                <button onClick={() => handleDownloadPDF(form.type, arbitration)} style={{ width: "100%", background: "blue", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }}>Download</button>
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
          {images.map((src, idx) => (
            <div key={idx} className="relative h-48 w-48">
              <Image
                src={src}
                alt={`Document ${idx + 1}`}
                fill
                className="object-cover rounded border"
                sizes="(max-width: 192px) 100vw, 192px"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewArbitrationModal({ 
  open, 
  onClose, 
  arbitration, 
  onSeePhotos, 
  onRemoveSession 
}: { 
  open: boolean; 
  onClose: () => void; 
  arbitration: ArbitrationCase | null; 
  onSeePhotos: (images: string[]) => void; 
  onRemoveSession: (idx: number) => void; 
}) {
  if (!open || !arbitration) return null;
  
  // Debug logging to see what data we're receiving
  console.log('🔍 ViewArbitrationModal DEBUG:', {
    arbitration_id: arbitration.id,
    complaint_id: arbitration.complaint_id,
    panel_members: arbitration.panel_members,
    panel_members_type: typeof arbitration.panel_members,
    sessions: arbitration.sessions,
    sessions_count: arbitration.sessions?.length || 0,
    full_arbitration_object: arbitration
  });
  function formatModalDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const yy = d.getFullYear().toString().slice(-2);
    return `${mm}/${dd}/${yy}`;
  }
  function formatModalTime(timeStr: string) {
    if (!timeStr) return "—";
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    const d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <DocumentTextIcon className="h-8 w-8 text-blue-100" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Arbitration Details</h2>
              <p className="text-blue-100 text-sm">Arbitration ID #{arbitration.id}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group"
          >
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-8 space-y-8">
            <div className="bg-blue-50 rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Case Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Case No.:</span> {arbitration.complaint_id}</div>
                <div><span className="font-medium">Case Title:</span> {arbitration.case_title}</div>
                <div><span className="font-medium">Time Elapse:</span> {arbitration.time_elapse}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Complainant(s)</div>
                <div className="text-sm">{arbitration.complainants && arbitration.complainants.length > 0 ? arbitration.complainants.join(", ") : '—'}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Respondent(s)</div>
                <div className="text-sm">{arbitration.respondents && arbitration.respondents.length > 0 ? arbitration.respondents.join(", ") : '—'}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><ScaleIcon className="h-5 w-5" /> Arbitration Schedule</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {arbitration.sessions && arbitration.sessions.length > 0 && (
                  <>
                    <div>
                      <span className="font-medium">Initial Schedule:</span> {formatModalDate(arbitration.sessions[0].schedule_date)} {formatModalTime(arbitration.sessions[0].schedule_time)}
                    </div>
                    {arbitration.sessions.slice(1).map((s: ArbitrationSession, idx: number) => (
                      <div key={idx}>
                        <span className="font-medium">Reschedule #{idx + 1}:</span> {formatModalDate(s.schedule_date)} {formatModalTime(s.schedule_time)}
                      </div>
                    ))}
                  </>
                )}
                {(!arbitration.sessions || arbitration.sessions.length === 0) && <div>—</div>}
              </div>
            </div>
            
            {/* Selected Lupon Panel Section */}
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <UsersIcon className="h-5 w-5" /> Selected Lupon Panel
              </div>
              
              {(() => {
                // Check for panel data from multiple sources
                let panelMembers: string[] = [];
                
                // First check if panel data exists in sessions
                if (arbitration.sessions && arbitration.sessions.length > 0 && 
                    arbitration.sessions[0].panel && arbitration.sessions[0].panel.length > 0) {
                  panelMembers = arbitration.sessions[0].panel;
                }
                // If not in sessions, check if it exists in the main arbitration object (from panel_members field)
                else if (arbitration.panel_members) {
                  try {
                    panelMembers = typeof arbitration.panel_members === 'string' 
                      ? JSON.parse(arbitration.panel_members) 
                      : arbitration.panel_members;
                    
                    // Ensure we have an array of strings
                    if (Array.isArray(panelMembers)) {
                      panelMembers = panelMembers.map((member: string | { name?: string }) => 
                        typeof member === 'string' ? member : (member?.name || 'Unknown Member')
                      );
                    } else {
                      panelMembers = [];
                    }
                  } catch (e) {
                    console.error('Error parsing panel_members:', e);
                    panelMembers = [];
                  }
                }
                
                return panelMembers && panelMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {panelMembers.map((member: string, index: number) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {member.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-blue-900">{member}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <div className="text-gray-500 text-sm italic">No Lupon panel members assigned yet</div>
                    <div className="text-gray-400 text-xs mt-1">Panel members will be displayed here once arbitration is set</div>
                  </div>
                );
              })()}
            </div>
            {/* Arbitration Sessions History */}
            {arbitration.sessions && arbitration.sessions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <DocumentTextIcon className="h-5 w-5" /> Arbitration Sessions History
                </div>
                <div className="space-y-4">
                  {arbitration.sessions.map((session: ArbitrationSession, idx: number) => (
                    <div key={session.id || `session-${idx}`} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-semibold text-blue-700 mb-1">
                            {idx === 0 ? 'Initial Session' : `Reschedule #${idx}`}
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {formatModalDate(session.schedule_date)} at {formatModalTime(session.schedule_time)}
                          </div>
                          {idx > 0 && session.reason && session.reason !== 'Initial session' && (
                            <div className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Reason:</span> {session.reason}
                            </div>
                          )}
                        </div>
                        {idx !== 0 && (
                          <button 
                            type="button" 
                            onClick={() => onRemoveSession(idx)} 
                            className="bg-white border border-gray-400 rounded-full p-1 shadow hover:bg-red-500 hover:text-white transition-colors"
                            title="Remove Session"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Minutes Section */}
                      <div className="mb-3">
                        <div className="font-medium text-blue-700 mb-2">Arbitration Minutes:</div>
                        <div className="text-sm bg-white rounded p-3 border border-blue-100 min-h-[60px]">
                          {session.arbitration_minutes ? (
                            <div className="whitespace-pre-wrap">{session.arbitration_minutes}</div>
                          ) : (
                            <span className="italic text-gray-400">No minutes recorded for this session.</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Documentation Section - Per Session */}
                      <div>
                        <div className="font-medium text-blue-700 mb-2">Documentation:</div>
                        <div className="text-sm">
                          {session.documentation && session.documentation.length > 0 ? (
                            <button 
                              className="bg-blue-100 border border-blue-300 rounded px-4 py-2 text-blue-700 font-semibold hover:bg-blue-200 transition-colors"
                              onClick={() => {
                                // Convert file paths to proper URLs
                                const documentationUrls = session.documentation.map((path: string) => {
                                  const url = `http://localhost:5000/${path.replace(/\\/g, '/')}`;
                                  return url;
                                });
                                onSeePhotos(documentationUrls);
                              }}
                            >
                              View Documentation ({session.documentation.length} files)
                            </button>
                          ) : (
                            <span className="italic text-gray-400">No documentation uploaded for this session.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No sessions message */}
            {(!arbitration.sessions || arbitration.sessions.length === 0) && (
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <DocumentTextIcon className="h-5 w-5" /> Arbitration Sessions History
                </div>
                <div className="text-center text-gray-500 italic py-8">
                  No sessions recorded yet.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StartArbitrationModal({ 
  open, 
  onClose, 
  arbitration, 
  onSave, 
  onReschedule, 
  onSettle 
}: { 
  open: boolean; 
  onClose: () => void; 
  arbitration: ArbitrationCase | null; 
  onSave: (minutes: string, images: File[]) => void; 
  onReschedule: (date: string, time: string, reason?: string) => void; 
  onSettle: (agreements: string, remarks: string) => void; 
}) {
  const [minutes, setMinutes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [processType, setProcessType] = useState("start");
  const [reschedDate, setReschedDate] = useState("");
  const [reschedTime, setReschedTime] = useState("");
  const [warning, setWarning] = useState("");
  const [agreements, setAgreements] = useState<string[]>([""]);
  const [remarks, setRemarks] = useState("");
  const [reschedReason, setReschedReason] = useState("");
  
  // Enhanced reschedule modal state (from mediation reschedule modal)
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  interface SlotInfo {
    date: string;
    availableSlots?: Array<{
      time: string;
      isAvailable: boolean;
    }>;
    scheduledTimes?: string[];
    isFull?: boolean;
    usedSlots?: number;
    maxSlots?: number;
  }
  
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

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
      setShowWarningModal(false);
      setWarningModalMessage("");
      setSlotInfo(null);
      setBookedTimes([]);
    }
  }, [open]);

  // Enhanced reschedule functions (from mediation reschedule modal)
  const showWarning = (message: string) => {
    setWarningModalMessage(message);
    setShowWarningModal(true);
  };

  // Function to fetch slot availability for a selected date (mediation endpoint for cross-system validation)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      let url = `http://localhost:5000/api/mediation/available-slots/${selectedDate}`;
      if (processType === 'reschedule' && arbitration?.id) {
        url += `?excludeArbitrationId=${arbitration.id}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Backend returns data in nested data property
        setSlotInfo({
          date: reschedDate, // Add the date from the reschedule date picker
          availableSlots: data.data.availableSlots || [],
          usedSlots: data.data.usedSlots || 0,
          maxSlots: data.data.maxSlotsPerDay || 0,
          scheduledTimes: data.data.scheduledTimes || [],
          isFull: data.data.isFull || false
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

  const handleDateSelect = (dateString: string) => {
    setReschedDate(dateString);
    setReschedTime(""); // Reset time when date changes
    fetchSlotAvailability(dateString);
  };

  // Generate calendar data for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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

  const isTimeSlotBooked = (time: string) => {
    // Convert 24-hour format to 12-hour format for comparison
    const convertTo12Hour = (time24: string) => {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    // Check both 24-hour and 12-hour formats
    const time12Hour = convertTo12Hour(time);
    const isBooked24 = bookedTimes.includes(time);
    const isBooked12 = bookedTimes.includes(time12Hour);
    const isBooked = isBooked24 || isBooked12;
    
    console.log('Time slot check:', { 
      time, 
      time12Hour, 
      bookedTimes, 
      isBooked24, 
      isBooked12, 
      isBooked 
    });
    
    return isBooked;
  };

  const validateTimeSlot = (selectedTime: string) => {
    if (isTimeSlotBooked(selectedTime)) {
      console.log('Showing booked time slot warning for:', selectedTime);
      showWarning(`This time slot (${selectedTime}) is already selected by another session. Please choose a different time slot.`);
      return false;
    }
    return true;
  };



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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (processType === "start") {
      // Validate that the scheduled date and time has occurred
      if (!isScheduledDateTimePassed()) {
        setWarning("You cannot start the arbitration yet. The scheduled date and time has not occurred.");
        return;
      }
      
      if (!minutes.trim()) {
        setWarning("Please enter the minutes of the meeting.");
        return;
      }
      
      if (!arbitration) {
        setWarning("No arbitration data available.");
        return;
      }
      
      const lastSession = arbitration.sessions[arbitration.sessions.length - 1];
      if (lastSession.arbitration_minutes || (lastSession.documentation && lastSession.documentation.length > 0)) {
        setWarning("You must reschedule before starting a new arbitration session.");
        return;
      }
      setWarning("");
      onSave(minutes, images);
      onClose();
    } else if (processType === "reschedule") {
      // Enhanced validation for reschedule
      if (!reschedDate || !reschedTime) {
        setWarning("Please select both date and time for rescheduling.");
        return;
      }
      
      if (!reschedReason.trim()) {
        setWarning("Please provide a reason for rescheduling.");
        return;
      }
      
      // Validate time slot availability - CRITICAL: Prevent duplicate bookings
      if (!validateTimeSlot(reschedTime)) {
        return; // validateTimeSlot already shows the warning
      }
      
      // Additional validation: Check if time slot is in scheduledTimes from slotInfo
      if (slotInfo?.scheduledTimes && slotInfo.scheduledTimes.includes(reschedTime)) {
        showWarning(`This time slot (${reschedTime}) is already scheduled. Please choose a different time slot.`);
        return;
      }
      
      // Additional validation: Check 12-hour format in scheduledTimes
      if (slotInfo?.scheduledTimes) {
        const convertTo12Hour = (time24: string) => {
          const [hours, minutes] = time24.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };
        const time12Hour = convertTo12Hour(reschedTime);
        if (slotInfo.scheduledTimes.includes(time12Hour)) {
          showWarning(`This time slot (${reschedTime}) is already scheduled. Please choose a different time slot.`);
          return;
        }
      }
      
      // Check if slot is full
      if (slotInfo?.isFull) {
        showWarning("The selected date has reached the maximum number of sessions (4). Please choose a different date.");
        return;
      }
      
      setWarning("");
      onReschedule(reschedDate, reschedTime, reschedReason);
      onClose();
    } else if (processType === "settled") {
      // Validate agreements
      const validAgreements = agreements.filter(a => a.trim() !== "");
      if (validAgreements.length === 0) {
        setWarning("Please enter at least one agreement.");
        return;
      }
      
      // Call settlement handler
      const agreementsText = validAgreements.join("; ");
      onSettle(agreementsText, remarks);
      onClose();
    }
  };

  // Agreement handlers
  const handleAddAgreement = () => setAgreements(prev => [...prev, ""]);
  const handleRemoveAgreement = (idx: number) => setAgreements(prev => prev.filter((_, i) => i !== idx));
  const handleAgreementChange = (idx: number, value: string) => setAgreements(prev => prev.map((a, i) => i === idx ? value : a));

  // Helper to check if scheduled date and time has passed
  const isScheduledDateTimePassed = () => {
    if (!arbitration || !arbitration.sessions.length) return false;
    const lastSession = arbitration.sessions[arbitration.sessions.length - 1];
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

  if (!open || !arbitration) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
          <div className="flex items-center gap-3">
            <PlayCircleIcon className="h-8 w-8 text-blue-100" />
            <div>
              <h2 className="text-2xl font-bold capitalize">{processType === "start" ? "Start Arbitration" : processType === "reschedule" ? "Reschedule Arbitration" : "Settle Arbitration"}</h2>
              <p className="text-blue-100 text-sm">Arbitration ID #{arbitration.id}</p>
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
                <option value="start">Start Arbitration</option>
                <option value="reschedule">Reschedule</option>
                <option value="settled">Settled</option>
              </select>
            </div>
            {processType === "start" && (
              <>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Arbitration Minutes</label>
                  <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" value={minutes} onChange={e => { setMinutes(e.target.value); setWarning(""); }} placeholder="Enter arbitration minutes..." required />
                </div>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Arbitration Documentation (Upload Photos)</label>
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
                          <div className="relative h-20 w-20">
                            <Image 
                              src={src} 
                              alt={`doc-${idx}`} 
                              fill
                              className="object-cover rounded border"
                              sizes="5rem"
                              priority={false}
                            />
                          </div>
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
      
      {/* Warning Modal for Scheduling Conflicts */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border border-amber-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-amber-800 mb-2">Scheduling Conflict</h3>
              <p className="text-amber-700 text-sm mb-6 leading-relaxed">
                {warningModalMessage}
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettlementModal({ 
  open, 
  onClose, 
  arbitration, 
  onSave 
}: { 
  open: boolean; 
  onClose: () => void; 
  arbitration: ArbitrationCase | null; 
  onSave: (agreements: string, remarks: string) => void; 
}) {
  const [agreements, setAgreements] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (!open) {
      setAgreements("");
      setRemarks("");
    }
  }, [open, setAgreements, setRemarks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreements.trim()) {
      alert("Please enter settlement agreements");
      return;
    }
    onSave(agreements, remarks);
    onClose();
  };

  if (!open || !arbitration) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-blue-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">Mark Case as Settled</h2>
              <p className="text-green-500 text-sm">Case #{arbitration.complaint_id} - {arbitration.case_title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-gray-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Agreements *</label>
            <textarea
              value={agreements}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAgreements(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the settlement agreements reached through arbitration..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="Additional remarks about the settlement..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Mark as Settled
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ArbitrationPage() {
  const [arbitrations, setArbitrations] = useState<ArbitrationCase[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [viewArbitration, setViewArbitration] = useState<ArbitrationCase | null>(null);
  const [startArbitration, setStartArbitration] = useState<ArbitrationCase | null>(null);
  const [photosToView, setPhotosToView] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartSuccess, setShowStartSuccess] = useState(false);
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showSettlementSuccess, setShowSettlementSuccess] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedArbitrationForForms, setSelectedArbitrationForForms] = useState<ArbitrationCase | null>(null);

  const fetchArbitrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/arbitration');
      if (!response.ok) {
        throw new Error('Failed to fetch arbitrations');
      }
      const data = await response.json();
      
      // Define types for API response
      interface RescheduleApiResponse {
        id: number;
        reschedule_date: string;
        reschedule_time: string;
        minutes: string;
        documentation: string[] | string; // Can be either array or string (JSON string)
        reason?: string;
      }

      interface ArbitrationApiResponse {
        id: number;
        complaint_id: number;
        case_title: string;
        date: string;
        time: string;
        minutes: string;
        documentation: string[] | string;
        reschedules?: RescheduleApiResponse[];
        panel_members?: string | Array<{id: string | number; name: string}>;
        time_elapse?: string;
        created_at: string;
        complainant?: string;
        respondent?: string;
        [key: string]: unknown;
      }

      // Transform data to match frontend interface
      const transformedData = data.map((arb: ArbitrationApiResponse) => {
        // Create sessions array from reschedules (like mediation/conciliation)
        const rescheduleSessions = arb.reschedules?.map((reschedule: RescheduleApiResponse) => ({
          id: reschedule.id,
          schedule_date: reschedule.reschedule_date,
          schedule_time: reschedule.reschedule_time,
          arbitration_minutes: reschedule.minutes || '',
          // Process documentation array properly from backend
          documentation: Array.isArray(reschedule.documentation) ? reschedule.documentation : [],
          reason: reschedule.reason || ''
        })) || [];
        
        // If no reschedules exist, create initial session from main arbitration date/time
        const sessions = rescheduleSessions.length > 0 ? rescheduleSessions : [{
          schedule_date: arb.date,
          schedule_time: arb.time,
          arbitration_minutes: arb.minutes || '',
          documentation: Array.isArray(arb.documentation) ? arb.documentation : (arb.documentation ? JSON.parse(arb.documentation) : [])
        }];
        
        // Define panel member type
        interface PanelMember {
          id?: string | number;
          name?: string;
          [key: string]: unknown;
        }

        // Process panel_members - handle both string (JSON) and array formats
        let panelMembers: Array<{id: string | number; name: string}> = [];
        if (arb.panel_members) {
          try {
            // If panel_members is a string, parse it as JSON
            const parsedMembers: PanelMember | PanelMember[] = typeof arb.panel_members === 'string' 
              ? JSON.parse(arb.panel_members)
              : arb.panel_members;
              
            // Ensure we have an array of objects with id and name
            const membersArray = Array.isArray(parsedMembers) ? parsedMembers : [parsedMembers];
            if (membersArray.length > 0) {
              panelMembers = membersArray.map((member: PanelMember, i: number) => ({
                id: member?.id || i,
                name: typeof member === 'string' ? member : (member?.name || `Panel Member ${i + 1}`)
              }));
            }
          } catch (e) {
            console.error('Error parsing panel_members:', e);
          }
        }
        
        return {
          id: arb.id,
          complaint_id: arb.complaint_id,
          case_title: arb.case_title,
          complainants: arb.complainant ? [arb.complainant] : [],
          respondents: arb.respondent ? [arb.respondent] : [],
          time_elapse: calculateTimeElapse(arb.created_at),
          sessions: sessions,
          panel_members: panelMembers
        };
      });
      
      setArbitrations(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching arbitrations:', err);
      setError('Failed to load arbitrations');
      setArbitrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate time elapsed since creation (matching conciliation logic)
  const calculateTimeElapse = (createdAt: string) => {
    if (!createdAt) return '0/15';
    const daysElapsed = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const clampedDays = Math.max(0, Math.min(daysElapsed, 15)); // Clamp between 0 and 15
    return `${clampedDays}/15`;
  };

  useEffect(() => {
    fetchArbitrations();
  }, [fetchArbitrations]);

  // Storage and focus event listeners removed as they were only used for luponMembers
  // which has been removed from this component

  const sortedCases = [...arbitrations].sort((a, b) => {
    const aDays = parseInt(a.time_elapse.split("/")[0], 10);
    const bDays = parseInt(b.time_elapse.split("/")[0], 10);
    return bDays - aDays;
  });

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    // Use local date formatting to avoid UTC conversion issues
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatTime(timeStr: string) {
    if (!timeStr) return "—";
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [h, m] = timeStr.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
    const d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${hour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` + ` ${ampm}`;
    }
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

  const handleSaveArbitration = async (minutes: string, images: File[]) => {
    if (!startArbitration) return;
    
    try {
      const formData = new FormData();
      formData.append('arbitration_id', startArbitration.id.toString());
      formData.append('minutes', minutes);
      
      // Add images to form data
      images.forEach((image) => {
        formData.append('documentation', image);
      });
      
      const response = await fetch('http://localhost:5000/api/arbitration/save-session', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to save arbitration session');
      }
      
      // Refresh arbitrations data
      await fetchArbitrations();
      setShowStartSuccess(true);
      setStartArbitration(null);
      setShowStartModal(false);
    } catch (error) {
      console.error('Error saving arbitration session:', error);
      setError('Failed to save arbitration session');
    }
  };
  
  const handleRescheduleArbitration = async (date: string, time: string, reason?: string) => {
    if (!startArbitration) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/arbitration/reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          arbitration_id: startArbitration.id,
          reschedule_date: date,
          reschedule_time: time,
          reason: reason || 'Rescheduled by admin'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reschedule arbitration');
      }
      
      // Refresh arbitrations data
      await fetchArbitrations();
      setShowRescheduleSuccess(true);
      setStartArbitration(null);
      setShowStartModal(false);
    } catch (error) {
      console.error('Error rescheduling arbitration:', error);
      setError('Failed to reschedule arbitration');
    }
  };
  
  const handleRemoveSession = async (sessionId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/arbitration/session/${sessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove session');
      }
      
      // Refresh arbitrations data
      await fetchArbitrations();
    } catch (error) {
      console.error('Error removing session:', error);
      setError('Failed to remove session');
    }
  };

  const handleSettlement = async (agreements: string, remarks: string): Promise<void> => {
    if (!startArbitration) {
      console.error('No arbitration data available for settlement');
      return;
    }
    
    try {
      console.log('Creating settlement for arbitration:', startArbitration.complaint_id);
      const settlementData = {
        complaint_id: startArbitration.complaint_id,
        settlement_type: 'arbitration',
        // Use local date formatting to avoid UTC conversion issues
        settlement_date: (() => {
          const today = new Date();
          return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        })(), // Today's date
        agreements: agreements,
        remarks: remarks
      };
      
      console.log('Settlement data:', settlementData);
      
      const response = await fetch('http://localhost:5000/api/settlement/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settlementData),
      });
      
      console.log('Settlement API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Settlement API error:', errorText);
        throw new Error(`Failed to create settlement: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Settlement created successfully:', result);
      
      // Show success message
      setShowSettlementSuccess(true);
      setStartArbitration(null);
      setShowStartModal(false);
      
      // Refresh arbitrations data
      await fetchArbitrations();
    } catch (error) {
      console.error('Error creating settlement:', error);
      setError(`Failed to create settlement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle opening Forms modal
  const handleOpenFormsModal = (arbitration: ArbitrationCase) => {
    setSelectedArbitrationForForms(arbitration);
    setShowFormsModal(true);
  };

  // Handle PDF download for arbitration hearing form
  const handleDownloadArbitrationPDF = async (arbitrationCase: ArbitrationCase) => {
    try {
      // Get the latest session data for this case
      const latestSession = arbitrationCase.sessions[arbitrationCase.sessions.length - 1];
      
      if (!latestSession) {
        alert('No arbitration session data available for this case.');
        return;
      }

      // Prepare arbitration data for PDF generation
      const arbitrationData = {
        complainant: arbitrationCase.complainants.join(', '),
        respondent: arbitrationCase.respondents.join(', '),
        case_title: arbitrationCase.case_title,
        case_no: arbitrationCase.complaint_id,
        date: latestSession.schedule_date,
        time: latestSession.schedule_time,
        minutes: latestSession.arbitration_minutes || 'No minutes recorded'
      };

      const response = await fetch('http://localhost:5000/api/pdf/generate-arbitration-hearing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arbitrationData }),
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
      a.download = `Arbitration-Hearing-${arbitrationCase.complaint_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading arbitration PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Handle downloading different types of arbitration PDFs
  const handleDownloadPDF = async (formType: string, arbitration: ArbitrationCase) => {
    try {
      if (formType === 'hearing') {
        // Use existing arbitration hearing PDF functionality
        await handleDownloadArbitrationPDF(arbitration);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ViewArbitrationModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        arbitration={viewArbitration}
        onSeePhotos={(images: string[]) => {
          setPhotosToView(images);
          setShowPhotosModal(true);
        }}
        onRemoveSession={handleRemoveSession}
      />
      <SeePhotosModal open={showPhotosModal} onClose={() => setShowPhotosModal(false)} images={photosToView} />
      <StartArbitrationModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        arbitration={startArbitration}
        onSave={handleSaveArbitration}
        onReschedule={handleRescheduleArbitration}
        onSettle={handleSettlement}
      />
      <SettlementModal
        open={showSettlementModal}
        onClose={() => setShowSettlementModal(false)}
        arbitration={startArbitration}
        onSave={handleSettlement}
      />
      {showStartSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Arbitration session saved successfully.</div>
            <button onClick={() => setShowStartSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showRescheduleSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Arbitration session rescheduled successfully.</div>
            <button onClick={() => setShowRescheduleSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showSettlementSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Case Settled!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been marked as settled through arbitration.</div>
            <button onClick={() => setShowSettlementSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Arbitration Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Arbitration/s list</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {arbitrations.length}
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
                  const days = parseInt(c.time_elapse.split("/")[0], 10);
                  return (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.complaint_id}</td>
                      <td className="px-4 py-2">{c.case_title}</td>
                      <td className="px-4 py-2">{c.complainants.join(", ")}</td>
                      <td className="px-4 py-2">{c.respondents.join(", ")}</td>
                      <td className="px-4 py-2">{c.sessions && c.sessions.length > 0 ? formatDate(c.sessions[c.sessions.length-1].schedule_date) : '—'}</td>
                      <td className="px-4 py-2">{c.sessions && c.sessions.length > 0 ? formatTime(c.sessions[c.sessions.length-1].schedule_time) : '—'}</td>
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
                            setViewArbitration(c);
                            setShowViewModal(true);
                          }}
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Start Arbitration"
                          onClick={() => { setStartArbitration(c); setShowStartModal(true); }}
                        >
                          <PlayCircleIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                          onClick={() => handleOpenFormsModal(c as ArbitrationCase)}
                        >
                          Forms
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="text-blue-600">Loading arbitrations...</div>
              </div>
            )}
            {error && (
              <div className="flex justify-center items-center py-8">
                <div className="text-red-600">{error}</div>
              </div>
            )}
            {!loading && !error && sortedCases.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">No arbitrations found.</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Forms Modal */}
      <FormsModal
        open={showFormsModal}
        onClose={() => setShowFormsModal(false)}
        arbitration={selectedArbitrationForForms}
        handleDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}