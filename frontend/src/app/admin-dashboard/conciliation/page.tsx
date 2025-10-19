"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { EyeIcon, UsersIcon, ScaleIcon, PlayCircleIcon, XMarkIcon, DocumentTextIcon, IdentificationIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import SetArbitrationModalComplete from "../../../components/SetArbitrationModalComplete";

interface ConciliationSession {
  id: number;
  schedule_date: string;
  schedule_time: string;
  conciliation_minutes: string;
  documentation: string[];
  reschedules?: Array<{
    id: number;
    schedule_date: string;
    schedule_time: string;
    conciliation_minutes: string;
    documentation: string[];
    panel?: string[];
    reason?: string;
    created_at?: string;
  }>;
  panel?: string[];
  reason?: string;
}

interface ConciliationCase {
  id?: number;
  complaint_id: number;
  conciliation_id?: number | null;
  case_title: string;
  complainants: string[];
  respondents: string[];
  time_elapse: string;
  sessions: ConciliationSession[];
  lupon_panel?: string | string[];
}


// Utility: Always sort sessions by ID (oldest to newest)
function getSortedSessions(sessions: ConciliationSession[]): ConciliationSession[] {
  return [...sessions].sort((a, b) => a.id - b.id);
}

interface ConciliationReschedule {
  id: number;
  reschedule_date: string;
  reschedule_time: string;
  reason?: string;
  created_at?: string;
  documentation?: string[];
}

interface LuponMember {
  id: number;
  firstname?: string;
  lastname?: string;
  name?: string;
  display_name?: string;
}

interface ConciliationWithReschedules {
  reschedules?: ConciliationReschedule[];
  date?: string;
  time?: string;
  status?: string;
}

// Helper function to calculate time elapsed from scheduled date
function calculateTimeElapseFromSchedule(conciliationGroup: ConciliationWithReschedules[]): number {
  // Find the earliest scheduled date from all conciliation sessions
  let earliestScheduledDate: string | null = null;
  
  conciliationGroup.forEach(con => {
    // Check if this conciliation has reschedules with scheduled dates
    if (con.reschedules && Array.isArray(con.reschedules)) {
      con.reschedules.forEach((reschedule: ConciliationReschedule) => {
        if (reschedule.reschedule_date) {
          if (!earliestScheduledDate || new Date(reschedule.reschedule_date) < new Date(earliestScheduledDate)) {
            earliestScheduledDate = reschedule.reschedule_date;
          }
        }
      });
    }
    
    // Also check the main conciliation date as fallback
    if (con.date) {
      if (!earliestScheduledDate || new Date(con.date) < new Date(earliestScheduledDate)) {
        earliestScheduledDate = con.date;
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
  conciliation: ConciliationCase | null;
  handleDownloadPDF: (formType: string, conciliation: ConciliationCase, selectedMembers?: string[]) => void;
}

const FormsModal = ({ open, onClose, conciliation, handleDownloadPDF }: FormsModalProps) => {
  const [showMemberSelection, setShowMemberSelection] = React.useState(false);
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);
  
  if (!open || !conciliation) return null;

  // Get Lupon panel members from the conciliation case
  const getPanelMembers = (): string[] => {
    let panelMembers: string[] = [];
    
    // Check for panel data from multiple sources
    if (conciliation.sessions && conciliation.sessions.length > 0 && conciliation.sessions[0].panel && conciliation.sessions[0].panel.length > 0) {
      panelMembers = conciliation.sessions[0].panel;
    }
    // If not in sessions, check if it exists in the main conciliation object (from lupon_panel field)
    else if ('lupon_panel' in conciliation && conciliation.lupon_panel) {
      try {
        panelMembers = typeof conciliation.lupon_panel === 'string' 
          ? JSON.parse(conciliation.lupon_panel) 
          : conciliation.lupon_panel;
      } catch (e) {
        console.error('Error parsing lupon_panel:', e);
        panelMembers = [];
      }
    }
    
    return panelMembers;
  };

  const panelMembers = getPanelMembers();

  const handleMemberToggle = (member: string) => {
    setSelectedMembers(prev => 
      prev.includes(member) 
        ? prev.filter(m => m !== member)
        : [...prev, member]
    );
  };

  const handleGenerateSelectedForms = () => {
    if (selectedMembers.length === 0) {
      alert('Please select at least one Lupon member to generate forms for.');
      return;
    }
    
    // Call the download function with selected members
    handleDownloadPDF('notice-choose-pangkat-selected', conciliation, selectedMembers);
    setShowMemberSelection(false);
    setSelectedMembers([]);
  };

  const handleKPForm11Click = () => {
    if (panelMembers.length === 0) {
      alert('No Lupon panel members found for this case. Please ensure the conciliation has been set with panel members.');
      return;
    }
    setShowMemberSelection(true);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "#fff", margin: "40px auto", padding: 24, borderRadius: 8, maxWidth: showMemberSelection ? 1100 : 900, minHeight: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3b82f6", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Conciliation Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>
        
        {!showMemberSelection ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, justifyItems: "center" }}>
            {[
              { type: "hearing", title: "Minutes of Hearing", description: "Conciliation session minutes and documentation" },
              { type: "notice-constitution-pangkat", title: <div style={{ textAlign: "center" }}>Notice for Constitution of Pangkat</div>, description: "KP Form No. 10 - Official notice for pangkat constitution" },
              { type: "notice-choose-pangkat", title: "Notice to Choose Pangkat Member", description: "KP Form No. 11 - Individual notices for each selected Lupon member", isSpecial: true }
            ].map((form) => {
              return (
                <div key={form.type} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
                  <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#aaa" }}>[Preview]</span>
                  </div>
                  <div style={{ marginBottom: 4, fontWeight: 500 }}>{form.title}</div>
                  <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>{form.description}</div>
                  <button 
                    onClick={() => form.isSpecial ? handleKPForm11Click() : handleDownloadPDF(form.type, conciliation)} 
                    style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }}
                  >
                    {form.isSpecial ? 'Select Members' : 'Download'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 20 }}>
              <button 
                onClick={() => { setShowMemberSelection(false); setSelectedMembers([]); }}
                style={{ background: "#6b7280", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer", marginBottom: 16 }}
              >
                ← Back to Forms
              </button>
              <h3 style={{ margin: "0 0 16px 0", color: "#1f2937" }}>Select Lupon Members for KP Form 11</h3>
              <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: 14 }}>Choose which Lupon panel members you want to generate Notice to Choose Pangkat Member forms for:</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginBottom: 24 }}>
              {panelMembers.map((member, index) => (
                <div 
                  key={index}
                  onClick={() => handleMemberToggle(member)}
                  style={{ 
                    border: selectedMembers.includes(member) ? "2px solid #3b82f6" : "2px solid #e5e7eb",
                    borderRadius: 8, 
                    padding: 16, 
                    cursor: "pointer",
                    background: selectedMembers.includes(member) ? "#eff6ff" : "#f9fafb",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 4, 
                      border: "2px solid #3b82f6", 
                      background: selectedMembers.includes(member) ? "#3b82f6" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {selectedMembers.includes(member) && (
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, color: "#1f2937", marginBottom: 4 }}>{member}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>Lupon Panel Member</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ color: "#6b7280", fontSize: 14 }}>
                {selectedMembers.length} of {panelMembers.length} members selected
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => setSelectedMembers(panelMembers)}
                  style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
                >
                  Select All
                </button>
                <button 
                  onClick={() => setSelectedMembers([])}
                  style={{ background: "#f3f4f6", color: "#374151", border: "none", padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}
                >
                  Clear All
                </button>
                <button 
                  onClick={handleGenerateSelectedForms}
                  disabled={selectedMembers.length === 0}
                  style={{ 
                    background: selectedMembers.length === 0 ? "#d1d5db" : "#10b981", 
                    color: "#fff", 
                    border: "none", 
                    padding: "8px 24px", 
                    borderRadius: 4, 
                    cursor: selectedMembers.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: 500
                  }}
                >
                  Generate Forms ({selectedMembers.length})
                </button>
              </div>
            </div>
          </div>
        )}
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
            <Image 
              key={idx} 
              src={src} 
              alt={`doc-${idx}`} 
              width={192} 
              height={192} 
              className="object-cover rounded border"
              style={{ width: '192px', height: '192px' }}
              unoptimized={src.startsWith('blob:')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ViewConciliationModalProps {
  open: boolean;
  onClose: () => void;
  conciliation: ConciliationCase;
  onSeePhotos: (images: string[]) => void;
  onRemoveSession: (idx: number) => void;
}

function ViewConciliationModal({ 
  open, 
  onClose, 
  conciliation, 
  onSeePhotos, 
  onRemoveSession 
}: ViewConciliationModalProps) {
  if (!open || !conciliation) return null;
  
  // Debug logging to see what data we're receiving
  console.log('🔍 ViewConciliationModal DEBUG:', {
    conciliation_id: conciliation.id,
    complaint_id: conciliation.complaint_id,
    lupon_panel: conciliation.lupon_panel,
    lupon_panel_type: typeof conciliation.lupon_panel,
    sessions: conciliation.sessions,
    sessions_count: conciliation.sessions?.length || 0,
    first_session_panel: conciliation.sessions?.[0]?.panel
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
      let h = d.getHours();
      let m = d.getMinutes();
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
              <h2 className="text-2xl font-bold">Conciliation Details</h2>
              <p className="text-blue-100 text-sm">Conciliation ID #{conciliation.id}</p>
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
                <div><span className="font-medium">Case No.:</span> {conciliation.complaint_id}</div>
                <div><span className="font-medium">Case Title:</span> {conciliation.case_title}</div>
                <div><span className="font-medium">Time Elapse:</span> {conciliation.time_elapse}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Complainant(s)</div>
                <div className="text-sm">{conciliation.complainants && conciliation.complainants.length > 0 ? conciliation.complainants.join(", ") : '—'}</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Respondent(s)</div>
                <div className="text-sm">{conciliation.respondents && conciliation.respondents.length > 0 ? conciliation.respondents.join(", ") : '—'}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><ScaleIcon className="h-5 w-5" /> Conciliation Schedule</div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {conciliation.sessions && conciliation.sessions.length > 0 && (
                  <>
                    <div>
                      <span className="font-medium">Initial Schedule:</span> {formatModalDate(conciliation.sessions[0].schedule_date)} {formatModalTime(conciliation.sessions[0].schedule_time)}
                    </div>
                    {conciliation.sessions.slice(1).map((s: ConciliationSession, idx: number) => (
                      <div key={idx}>
                        <span className="font-medium">Reschedule #{idx + 1}:</span> {formatModalDate(s.schedule_date)} {formatModalTime(s.schedule_time)}
                      </div>
                    ))}
                  </>
                )}
                {(!conciliation.sessions || conciliation.sessions.length === 0) && <div>—</div>}
              </div>
            </div>
            {/* Selected Lupon Panel Section */}
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <UsersIcon className="h-5 w-5" /> Selected Lupon Panel
              </div>
              {(() => {
                // Check for panel data from multiple sources
                let panelMembers = [];
                
                // First check if panel data exists in sessions
                if (conciliation.sessions && conciliation.sessions.length > 0 && conciliation.sessions[0].panel && conciliation.sessions[0].panel.length > 0) {
                  panelMembers = conciliation.sessions[0].panel;
                }
                // If not in sessions, check if it exists in the main conciliation object (from lupon_panel field)
                else if (conciliation.lupon_panel) {
                  try {
                    panelMembers = typeof conciliation.lupon_panel === 'string' ? JSON.parse(conciliation.lupon_panel) : conciliation.lupon_panel;
                  } catch (e) {
                    console.error('Error parsing lupon_panel:', e);
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
            {/* Conciliation Sessions History */}
            {conciliation.sessions && conciliation.sessions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <DocumentTextIcon className="h-5 w-5" /> Conciliation Sessions History
                </div>
                <div className="space-y-4">
                  {conciliation.sessions.map((session: ConciliationSession, idx: number) => (
                    <div key={session.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
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
                        <div className="font-medium text-blue-700 mb-2">Conciliation Minutes:</div>
                        <div className="text-sm bg-white rounded p-3 border border-blue-100 min-h-[60px]">
                          {session.conciliation_minutes ? (
                            <div className="whitespace-pre-wrap">{session.conciliation_minutes}</div>
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
                                  const normalized = path.replace(/\\/g, '/');
                                  // If backend already returned an absolute URL, use as-is; otherwise prepend server origin
                                  return /^https?:\/\//i.test(normalized)
                                    ? normalized
                                    : `http://localhost:5000/${normalized}`;
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
            
            {/* No Sessions Message */}
            {(!conciliation.sessions || conciliation.sessions.length === 0) && (
              <div className="bg-gray-50 rounded-2xl p-6 shadow border border-gray-200 text-center">
                <div className="text-gray-500 italic">No conciliation sessions have been conducted yet.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StartConciliationModalProps {
  open: boolean;
  onClose: () => void;
  conciliation: ConciliationCase;
  onSave: (minutes: string, images: File[]) => void;
  onReschedule: (date: string, time: string, reason?: string) => void;
  setShowSettlementSuccess: (show: boolean) => void;
}

function StartConciliationModal({ 
  open, 
  onClose, 
  conciliation, 
  onSave, 
  onReschedule, 
  setShowSettlementSuccess 
}: StartConciliationModalProps) {
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
  
  
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
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

  // Function to fetch slot availability for a selected date (conciliation-specific)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
        // When rescheduling, exclude the current conciliation session from booked times
      let url = `http://localhost:5000/api/conciliation/available-slots/${selectedDate}`;
      
      // DEBUG: Log the process type and conciliation data
      console.log('🔍 CONCILIATION RESCHEDULE DEBUG:');
      console.log('processType:', processType);
      console.log('conciliation?.id:', conciliation?.id);
      
      if (processType === 'reschedule' && conciliation?.id) {
        url += `?excludeConciliationId=${conciliation.id}`;
        console.log('Added exclusion parameter:', url);
      } else {
        console.log('❌ NOT adding excludeConciliationId - processType:', processType, 'conciliation?.id:', conciliation?.id);
      }
      
      console.log('Final URL:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('API Response data:', data);
        
        // Conciliation API now returns data in nested data property (consistent with mediation)
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.isReschedule ? data.data.actualUsedSlots : data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull,
          isReschedule: data.data.isReschedule
        });
        setBookedTimes(data.data.bookedTimes || []);
        
        console.log('Set slot info:', {
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          isFull: data.data.isFull
        });
      } else {
        console.error('Failed to fetch slot availability - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processType === "start") {
      // Validate that the scheduled date and time has occurred
      if (!isScheduledDateTimePassed()) {
        setWarning("You cannot start the conciliation yet. The scheduled date and time has not occurred.");
        return;
      }
      
      // Check if the current active session has already been completed
      const currentDate = conciliation.sessions[0]?.schedule_date;
      const currentTime = conciliation.sessions[0]?.schedule_time;
      
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
      const currentReschedule = conciliation.sessions[0]?.reschedules?.find((r: { schedule_date: string; schedule_time: string; minutes?: string }) => {
        const reschedDateFormatted = formatDateForComparison(r.schedule_date);
        const reschedTimeFormatted = formatTimeForComparison(r.schedule_time);
        
        return reschedDateFormatted === currentDateFormatted && 
               reschedTimeFormatted === currentTimeFormatted && 
               r.minutes && r.minutes.trim().length > 0;
      });
      
      if (currentReschedule) {
        setWarning("This conciliation session has already been completed. Please reschedule for a new session.");
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
      
      // Check if the selected time slot is already booked (with exclusion for current conciliation during reschedule)
      const isTimeSlotBooked = (time: string) => {
        // Convert 24-hour format to 12-hour format for comparison
        const convertTo12Hour = (time24: string) => {
          const [hours, minutes] = time24.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };
        
        // If we're in reschedule mode, exclude the current conciliation's time slot
        let filteredBookedTimes = [...bookedTimes];
        if (processType === 'reschedule' && conciliation?.sessions) {
          const currentSession = conciliation.sessions[conciliation.sessions.length - 1];
          if (currentSession?.schedule_time) {
            const currentTime24 = currentSession.schedule_time;
            const currentTime12 = convertTo12Hour(currentTime24);
            
            // Remove current conciliation's time slot from booked times
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
        
        console.log('Conciliation time slot check:', { 
          time, 
          time12Hour, 
          originalBookedTimes: bookedTimes,
          filteredBookedTimes, 
          isBooked24, 
          isBooked12, 
          isBooked,
          processType,
          currentConciliationTime: processType === 'reschedule' && conciliation?.sessions ? conciliation.sessions[conciliation.sessions.length - 1]?.schedule_time : null
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
        showWarning('Please add at least one agreement.');
        return;
      }
      
      try {
        const settlementData = {
          complaint_id: conciliation.complaint_id,
          settlement_type: 'conciliation',
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
        // Refresh the page to update the data
        window.location.reload();
      } catch (error) {
        console.error('Error creating settlement:', error);
        showWarning('Failed to create settlement. Please try again.');
      }
    }
  };

  // Agreement handlers
  const handleAddAgreement = () => setAgreements(prev => [...prev, ""]);
  const handleRemoveAgreement = (idx: number) => setAgreements(prev => prev.filter((_, i) => i !== idx));
  const handleAgreementChange = (idx: number, value: string) => setAgreements(prev => prev.map((a, i) => i === idx ? value : a));

  // Always use sorted sessions for logic
  const sortedSessions = getSortedSessions(conciliation?.sessions || []);

  // Helper to check if scheduled date and time has passed
  const isScheduledDateTimePassed = () => {
    if (!conciliation || !sortedSessions.length) return false;
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

  if (!open || !conciliation) return null;
  return (
    <>
    {/* Warning Modal */}
    {showWarningModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowWarningModal(false)}></div>
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
              <h2 className="text-2xl font-bold capitalize">{processType === "start" ? "Start Conciliation" : processType === "reschedule" ? "Reschedule Conciliation" : "Settle Conciliation"}</h2>
              <p className="text-blue-100 text-sm">Conciliation ID #{conciliation.id}</p>
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
                <option value="start">Start Conciliation</option>
                <option value="reschedule">Reschedule</option>
                <option value="settled">Settled</option>
              </select>
            </div>
            {processType === "start" && (
              <>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Conciliation Minutes</label>
                  <textarea className="w-full border rounded px-3 py-2 min-h-[80px]" value={minutes} onChange={e => { setMinutes(e.target.value); setWarning(""); }} placeholder="Enter conciliation minutes..." required />
                </div>
                <div>
                  <label className="block font-semibold text-blue-700 mb-2">Conciliation Documentation (Upload Photos)</label>
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
                          <Image 
                            src={src} 
                            alt={`doc-${idx}`} 
                            width={80} 
                            height={80} 
                            className="object-cover rounded border"
                            style={{ width: '80px', height: '80px' }}
                            unoptimized={src.startsWith('blob:')}
                          />
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
                  
                  {/* Professional Calendar Interface */}
                  <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                      <button
                        type="button"
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      <button
                        type="button"
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="p-4">
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
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
                                // Prevent any action if no date is selected or time is in the past
                                if (noDateSelected || isPastTime) {
                                  return;
                                }
                                if (!isDisabled && !isPastTime) {
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

interface SlotInfo {
  isFull: boolean;
  availableSlots: number;
  usedSlots: number;
  maxSlots: number;
  scheduledTimes: string[];
  isReschedule?: boolean;
}

interface ArbitrationCase {
  id?: number;
  complaint_id?: number;
  case_title?: string;
  complainants?: string[];
  respondents?: string[];
  // Add other properties as needed based on usage
}

interface SetArbitrationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (date: string, time: string, members: string[]) => void;
  arbitrators: { id: string; name: string }[];
  selectedCase?: ArbitrationCase;
}

function SetArbitrationModal({ open, onClose, onSave, arbitrators, selectedCase }: SetArbitrationModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [warning, setWarning] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

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

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Function to fetch slot availability for a selected date (using mediation endpoint for cross-system validation)
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/api/mediation/available-slots/${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        console.log('SetArbitrationModal - API Response:', data);
        console.log('SetArbitrationModal - Booked Times:', data.data.bookedTimes);
        
        // Backend returns data in nested data property
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull
        });
        // Normalize booked times to HH:mm format (remove seconds if present)
        const normalizedBookedTimes = (data.data.bookedTimes || []).map((time: string) => {
          // If time has seconds (HH:mm:ss), remove them to match frontend format (HH:mm)
          return time.length > 5 ? time.substring(0, 5) : time;
        });
        setBookedTimes(normalizedBookedTimes);
        console.log('SetArbitrationModal - Set bookedTimes state:', normalizedBookedTimes);
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

  const showWarning = (message: string) => {
    setWarningModalMessage(message);
    setShowWarningModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    
    try {
      // Basic validation
      if (!date || !time) {
        showWarning("Please select both date and time for the arbitration session.");
        setIsValidating(false);
        return;
      }

      // Check if time slot is already booked
      console.log('SetArbitrationModal - Validation Check:');
      console.log('Selected time:', time);
      console.log('Booked times array:', bookedTimes);
      console.log('Is time booked?', bookedTimes.includes(time));
      
      if (bookedTimes.includes(time)) {
        console.log('SetArbitrationModal - Time slot validation triggered!');
        showWarning("This time slot is already booked. Please select a different time.");
        setIsValidating(false);
        return;
      }

      // Check if day is full
      if (slotInfo?.isFull) {
        showWarning("No more slots available for this date. Please select a different date.");
        setIsValidating(false);
        return;
      }

      // Validate minimum 1-hour interval between sessions
      const selectedDateTime = new Date(`${date}T${time}:00`);
      const currentTime = new Date();
      const timeDifference = selectedDateTime.getTime() - currentTime.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      if (hoursDifference < 1 && selectedDateTime > currentTime) {
        showWarning("Arbitration sessions must be scheduled at least 1 hour in advance.");
        setIsValidating(false);
        return;
      }

      // Check if current arbitration session has recorded minutes (if selectedCase exists)
      if (selectedCase) {
        try {
          const response = await fetch(`http://localhost:5000/api/arbitration/case/${selectedCase.complaint_id}`);
          if (response.ok) {
            const arbitrationData = await response.json();
            
            // Check if there's an existing arbitration session without minutes
            const hasUncompletedSession = arbitrationData.some((session: any) => 
              !session.minutes || session.minutes.trim() === ''
            );
            
            if (hasUncompletedSession) {
              showWarning("There is an existing arbitration session without recorded minutes. Please complete the current session before scheduling a new one.");
              setIsValidating(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error checking arbitration session status:', error);
          // Continue with scheduling if API call fails
        }
      }

      // Check maximum slots per day (4 sessions)
      if (slotInfo && slotInfo.usedSlots >= 4) {
        showWarning("Maximum of 4 arbitration sessions per day has been reached. Please select a different date.");
        setIsValidating(false);
        return;
      }

      // All validations passed, proceed with saving
      onSave(date, time, members.filter(m => m));
      onClose();
      
    } catch (error) {
      console.error('Error during validation:', error);
      showWarning("An error occurred during validation. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setDate("");
      setTime("");
      setMembers(["", "", ""]);
      setWarning("");
      setSlotInfo(null);
      setBookedTimes([]);
      setShowWarningModal(false);
      setWarningModalMessage("");
      setIsValidating(false);
    }
  }, [open]);

  if (!open) return null;

  const calendarDays = generateCalendarDays();
  const timeSlots = [
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
  ];

  return (
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
            {/* Calendar Section */}
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Select Date</label>
              <div className="bg-white border border-amber-200 rounded-lg p-4">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-blue-700">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
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
                        p-2 text-sm rounded transition-colors
                        ${day.isSelected ? 'bg-blue-600 text-white font-bold' :
                          day.isAvailable ? 'hover:bg-blue-100 text-blue-700' :
                          day.isCurrentMonth ? 'text-gray-400 cursor-not-allowed' :
                          'text-gray-300 cursor-not-allowed'}
                        ${day.isToday && !day.isSelected ? 'ring-2 ring-blue-300' : ''}
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Slot Information */}
            {date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-2">Slot Availability for {date}</h4>
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Checking availability...</span>
                  </div>
                ) : slotInfo ? (
                  <div className="space-y-2">
                    <div className={`text-sm font-medium ${
                      slotInfo.isFull ? 'text-red-600' : 'text-blue-700'
                    }`}>
                      {slotInfo.availableSlots} slots available ({slotInfo.usedSlots}/{slotInfo.maxSlots} used)
                    </div>
                    {slotInfo.scheduledTimes && slotInfo.scheduledTimes.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Already scheduled:</span> {slotInfo.scheduledTimes.join(', ')}
                      </div>
                    )}
                    {slotInfo.isFull && (
                      <div className="text-sm text-red-600 font-medium">
                        ⚠️ No slots available for this date
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Unable to load slot information</div>
                )}
              </div>
            )}

            {/* Time Selection */}
            <div>
              <label className="block font-semibold text-blue-700 mb-3">
                Select Time {!date && <span className="text-sm text-gray-500">(Select a date first)</span>}
              </label>
              <div className="grid grid-cols-5 gap-2">
                {timeSlots.map(slot => {
                  const isBooked = bookedTimes.includes(slot.value);
                  const isSelected = time === slot.value;
                  
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
                    
                    // Parse the time slot (assuming format like "08:00", "13:00", etc.)
                    const [hours, minutes] = slot.value.split(':').map(Number);
                    
                    const slotTime = new Date();
                    slotTime.setHours(hours, minutes, 0, 0);
                    
                    return slotTime <= now;
                  })();
                  
                  const isDisabled = !date || isBooked || isPastTime;
                  
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
                      className={`
                        p-2 text-sm rounded border transition-colors
                        ${isSelected ? 'bg-blue-600 text-white border-blue-600' :
                          isBooked ? 'bg-red-100 text-red-600 border-red-300 cursor-not-allowed' :
                          isPastTime ? 'bg-orange-100 text-orange-500 border-orange-300 cursor-not-allowed' :
                          !date ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' :
                          'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}
                      `}
                      title={
                        isBooked ? 'Time slot already booked' : 
                        isPastTime ? 'This time has already passed' :
                        !date ? 'Please select a date first' : ''
                      }
                    >
                      {slot.display}
                      {isPastTime && (
                        <span className="ml-1 text-xs">⏰</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!date && (
                <p className="text-sm text-gray-500 mt-2">
                  Please select a date first to view available time slots
                </p>
              )}
            </div>

            {/* Arbitrator Members */}
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Lupon Members</label>
              {[0,1,2].map(i => {
                const selectedOthers = members.filter((m, idx) => idx !== i);
                const available = arbitrators.filter(a => !selectedOthers.includes(a.name) || a.name === members[i]);
                return (
                  <select
                    key={i}
                    className="border border-blue-300 rounded px-3 py-2 w-full mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={members[i]}
                    onChange={e => setMembers(m => { const arr = [...m]; arr[i] = e.target.value; return arr; })}
                  >
                    <option value="">Select Lupon Member {i+1} (optional)</option>
                    {available.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                );
              })}
            </div>

            {/* Warning Message */}
            {warning && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{warning}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium" 
                onClick={onClose}
                disabled={isValidating}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!date || !time || bookedTimes.includes(time) || slotInfo?.isFull || isValidating}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  !date || !time || bookedTimes.includes(time) || slotInfo?.isFull || isValidating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isValidating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {isValidating ? 'Validating...' : 'Set Arbitration'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200">
            <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-bold">Validation Warning</h3>
              </div>
              <button 
                onClick={() => setShowWarningModal(false)} 
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">{warningModalMessage}</p>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowWarningModal(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CFAModal({ open, onClose, selectedCase, onGenerateCFA }: { 
  open: boolean, 
  onClose: () => void, 
  selectedCase: ConciliationCase | null,
  onGenerateCFA: (complaintId: number, caseTitle: string) => void 
}) {
  if (!open || !selectedCase) return null;
  
  const handleGenerateCFA = () => {
    onGenerateCFA(selectedCase.complaint_id, selectedCase.case_title);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-indigo-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-indigo-100" />
            <div>
              <h2 className="text-2xl font-bold">Certificate to File Action</h2>
              <p className="text-indigo-100 text-sm">KP Form No. 20-B</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Case Information</h3>
              <p className="text-sm text-gray-700"><strong>Case No:</strong> {selectedCase.complaint_id}</p>
              <p className="text-sm text-gray-700"><strong>Case Title:</strong> {selectedCase.case_title}</p>
              <p className="text-sm text-gray-700"><strong>Complainant:</strong> {selectedCase.complainants.join(', ')}</p>
              <p className="text-sm text-gray-700"><strong>Respondent:</strong> {selectedCase.respondents.join(', ')}</p>
            </div>
            <p className="text-gray-700 mb-6">
              Generate an official Certificate to File Action (CFA) for this case. This certificate allows the complainant to file their case in court when barangay-level resolution is unsuccessful.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={handleGenerateCFA}
              className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Generate CFA PDF
            </button>
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConciliationPage() {

  const [conciliationCases, setConciliationCases] = useState<ConciliationCase[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewConciliation, setViewConciliation] = useState<any>(null);
  const [showSeePhotosModal, setShowSeePhotosModal] = useState(false);
  const [seePhotosImages, setSeePhotosImages] = useState<string[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [startConciliation, setStartConciliation] = useState<any>(null);
  const [showSetArbitrationModal, setShowSetArbitrationModal] = useState(false);
  const [selectedArbitrationCase, setSelectedArbitrationCase] = useState<any>(null);
  const [arbitrators, setArbitrators] = useState<{ id: string; name: string }[]>([]);
  const [showCFAModal, setShowCFAModal] = useState(false);
  const [selectedCFACase, setSelectedCFACase] = useState<ConciliationCase | null>(null);
  const [luponMembers, setLuponMembers] = useState<{ id: number; name: string }[]>([]);
  const [showStartSuccess, setShowStartSuccess] = useState(false);
  const [showRescheduleSuccess, setShowRescheduleSuccess] = useState(false);
  const [showArbitrationSuccess, setShowArbitrationSuccess] = useState(false);
  const [showSettlementSuccess, setShowSettlementSuccess] = useState(false);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedConciliationForForms, setSelectedConciliationForForms] = useState<ConciliationCase | null>(null);

  // Function to fetch fresh Lupon member data
  const fetchLuponMembers = async () => {
    try {
      type LuponMemberResponse = LuponMember | LuponMember[];
      const [membersRes, chairpersonRes, secretaryRes] = await Promise.all([
        fetch('http://localhost:5000/api/lupon-members').then(res => res.json() as Promise<LuponMember[]>),
        fetch('http://localhost:5000/api/lupon-chairperson').then(res => res.json() as Promise<LuponMember[]>),
        fetch('http://localhost:5000/api/lupon-secretary').then(res => res.json() as Promise<LuponMember[]>),
      ]);

      // Ensure we're working with arrays
      const members = Array.isArray(membersRes) ? membersRes : [membersRes].filter(Boolean);
      const chairperson = Array.isArray(chairpersonRes) ? chairpersonRes : [chairpersonRes].filter(Boolean);
      const secretary = Array.isArray(secretaryRes) ? secretaryRes : [secretaryRes].filter(Boolean);
      
      const all = [
        ...members.map(m => ({
          id: `member-${m.id}`,
          name: m.display_name || m.name || `${m.firstname || ''} ${m.lastname || ''}`.trim()
        })),
        ...chairperson.map(c => ({
          id: `chairperson-${c.id}`,
          name: c.display_name || c.name || `${c.firstname || ''} ${c.lastname || ''}`.trim()
        })),
        ...secretary.map(s => ({
          id: `secretary-${s.id}`,
          name: s.display_name || s.name || `${s.firstname || ''} ${s.lastname || ''}`.trim()
        })),
      ];
      
      setArbitrators(all);
      
      setLuponMembers(members.map(m => ({
        id: m.id,
        name: m.display_name || m.name || `${m.firstname || ''} ${m.lastname || ''}`.trim()
      })));
    } catch (error) {
      console.error('Failed to fetch Lupon members:', error);
    }
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/conciliation")
      .then(res => res.json())
      .then(conciliationCases => {
        console.log('Raw conciliation data:', conciliationCases);
        
        // Check if the response is an error object or not an array
        if (!Array.isArray(conciliationCases)) {
          console.error('Expected array from API, got:', conciliationCases);
          setConciliationCases([]);
          return;
        }
        
        // Group by complaint_id to create cases with multiple sessions
        const casesMap = new Map();
        
        conciliationCases.forEach((c: any) => {
          // Calculate days elapsed from scheduled date using helper function (like mediation)
          const daysElapsed = calculateTimeElapseFromSchedule([c]);
          const earliestCreatedAt = c.created_at;
          
          // Process reschedules to create sessions
          const sessions: any[] = [];
          
          if (c.reschedules && c.reschedules.length > 0) {
            // Sort reschedules by creation date
            const sortedReschedules = c.reschedules.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            sessions.push(...sortedReschedules.map((r: any) => ({
              id: r.id,
              schedule_date: r.reschedule_date || "",
              schedule_time: r.reschedule_time || "",
              conciliation_minutes: r.minutes || "",
              documentation: Array.isArray(r.documentation) ? r.documentation : (r.documentation ? JSON.parse(r.documentation) : []),
              reschedules: [],
              reason: r.reason || "",
            })));
          } else {
            // If no reschedules, create a session from the main conciliation data
            sessions.push({
              id: c.id,
              schedule_date: c.date || "",
              schedule_time: c.time || "",
              conciliation_minutes: c.minutes || "",
              documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
              reschedules: [],
            });
          }
          
          const caseData = {
            id: c.id,
            complaint_id: c.complaint_id,
            case_title: c.case_title || "",
            complainants: c.complainant ? c.complainant.split(", ") : [],
            respondents: c.respondent ? c.respondent.split(", ") : [],
            time_elapse: `${daysElapsed}/15`,
            sessions: sessions,
            created_at: earliestCreatedAt,
            status: c.status || "",
            // Keep case-level documentation for backward compatibility
            documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
            // Add lupon_panel data from the API response
            lupon_panel: c.lupon_panel,
          };
          
          casesMap.set(c.complaint_id, caseData);
        });
        
        const cases = Array.from(casesMap.values());
        console.log('Processed conciliation cases:', cases);
        setConciliationCases(cases);
      })
      .catch(err => {
        console.error('Failed to fetch conciliation data:', err);
        setConciliationCases([]);
      });
    
    // Fetch fresh Lupon member data on component mount
    fetchLuponMembers();
  }, []);

  // Add event listener for storage changes to sync with settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lupon_roster_updated') {
        console.log('Lupon roster updated, refreshing member data...');
        fetchLuponMembers();
        // Remove the flag after processing
        localStorage.removeItem('lupon_roster_updated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for updates when the window gains focus (for same-tab updates)
    const handleFocus = () => {
      if (localStorage.getItem('lupon_roster_updated')) {
        console.log('Lupon roster updated (same tab), refreshing member data...');
        fetchLuponMembers();
        localStorage.removeItem('lupon_roster_updated');
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const sortedCases = [...conciliationCases].sort((a, b) => {
    const aDays = parseInt(a.time_elapse.split("/")[0], 10);
    const bDays = parseInt(b.time_elapse.split("/")[0], 10);
    return bDays - aDays;
  });

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    // If it's an ISO string, parse as local date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      // Format as YYYY-MM-DD in local time
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback for plain YYYY-MM-DD
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [yyyy, mm, dd] = parts;
    return `${yyyy}-${mm}-${dd}`;
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
      let h = d.getHours();
      let m = d.getMinutes();
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

  const handleSaveConciliation = async (minutes: string, images: File[]) => {
    if (!startConciliation) return;
    // Use the main conciliation ID, not the session ID
    const formData = new FormData();
    formData.append('conciliation_id', String(startConciliation.id));
    formData.append('minutes', minutes);
    images.forEach((file) => formData.append('photos', file));

    const res = await fetch('http://localhost:5000/api/conciliation/session', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      // Refresh conciliation data
      const response = await fetch("http://localhost:5000/api/conciliation");
      if (response.ok) {
        const conciliationCases = await response.json();
        
        // Group by complaint_id to create cases with multiple sessions
        const casesMap = new Map();
        
        conciliationCases.forEach((c: any) => {
          // Calculate days elapsed from scheduled date using helper function (like mediation)
          const daysElapsed = calculateTimeElapseFromSchedule([c]);
          const earliestCreatedAt = c.created_at;
          
          // Process reschedules to create sessions
          const sessions = [];
          
          if (c.reschedules && c.reschedules.length > 0) {
            const sortedReschedules = c.reschedules.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            sessions.push(...sortedReschedules.map((r: any) => ({
              id: r.id,
              schedule_date: r.reschedule_date || "",
              schedule_time: r.reschedule_time || "",
              conciliation_minutes: r.minutes || "",
              documentation: Array.isArray(r.documentation) ? r.documentation : (r.documentation ? JSON.parse(r.documentation) : []),
              reschedules: [],
              reason: r.reason || "",
            })));
          } else {
            sessions.push({
              id: c.id,
              schedule_date: c.date || "",
              schedule_time: c.time || "",
              conciliation_minutes: c.minutes || "",
              documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
              reschedules: [],
            });
          }
          
          const caseData = {
            id: c.id,
            complaint_id: c.complaint_id,
            case_title: c.case_title || "",
            complainants: c.complainant ? c.complainant.split(", ") : [],
            respondents: c.respondent ? c.respondent.split(", ") : [],
            time_elapse: `${daysElapsed}/15`,
            sessions: sessions,
            created_at: earliestCreatedAt,
            status: c.status || "",
            documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
          };
          
          casesMap.set(c.complaint_id, caseData);
        });
        
        const cases = Array.from(casesMap.values());
        setConciliationCases(cases);
      }
      setShowStartSuccess(true);
      setStartConciliation(null);
      setShowStartModal(false);
    } else {
      alert('Failed to save conciliation session.');
    }
  };
  const handleRescheduleConciliation = async (date: string, time: string, rescheduleReason?: string) => {
    if (!startConciliation) {
      console.error('No startConciliation object found');
      alert('Error: No conciliation session selected');
      return;
    }
    
    try {
      // Use the main conciliation case id, not the session id
      const conciliationId = startConciliation.id;
      console.log('=== FRONTEND RESCHEDULE DEBUG ===');
      console.log('startConciliation object:', startConciliation);
      console.log('Rescheduling conciliation with ID:', conciliationId);
      console.log('Date:', date);
      console.log('Time:', time);
      console.log('Reason:', rescheduleReason);
      
      const requestBody = {
        conciliation_id: conciliationId,
        reschedule_date: date,
        reschedule_time: time,
        reason: rescheduleReason || 'Rescheduled by admin',
      };
      
      console.log('Request body being sent:', requestBody);
      
      const res = await fetch("http://localhost:5000/api/conciliation/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);
      
      const responseData = await res.json();
      console.log('Response data:', responseData);
      
      if (res.ok) {
        // Refresh conciliation data
        const response = await fetch("http://localhost:5000/api/conciliation");
        if (response.ok) {
          const conciliationCases = await response.json();
          
          // Group by complaint_id to create cases with multiple sessions
          const casesMap = new Map();
          
          conciliationCases.forEach((c: any) => {
            // Calculate days elapsed from scheduled date using helper function (like mediation)
          const daysElapsed = calculateTimeElapseFromSchedule([c]);
            const earliestCreatedAt = c.created_at;
            
            // Process reschedules to create sessions
            const sessions = [];
            
            if (c.reschedules && c.reschedules.length > 0) {
              const sortedReschedules = c.reschedules.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              
              sessions.push(...sortedReschedules.map((r: any) => ({
                id: r.id,
                schedule_date: r.reschedule_date || "",
                schedule_time: r.reschedule_time || "",
                conciliation_minutes: r.minutes || "",
                documentation: Array.isArray(r.documentation) ? r.documentation : (r.documentation ? JSON.parse(r.documentation) : []),
                reschedules: [],
                reason: r.reason || "",
              })));
            } else {
              sessions.push({
                id: c.id,
                schedule_date: c.date || "",
                schedule_time: c.time || "",
                conciliation_minutes: c.minutes || "",
                documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
                reschedules: [],
              });
            }
            
            const caseData = {
              id: c.id,
              complaint_id: c.complaint_id,
              case_title: c.case_title || "",
              complainants: c.complainant ? c.complainant.split(", ") : [],
              respondents: c.respondent ? c.respondent.split(", ") : [],
              time_elapse: `${daysElapsed}/15`,
              sessions: sessions,
              created_at: earliestCreatedAt,
              status: c.status || "",
              documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
            };
            
            casesMap.set(c.complaint_id, caseData);
          });
          
          const cases = Array.from(casesMap.values());
          setConciliationCases(cases);
        }
        setShowRescheduleSuccess(true);
      } else {
        console.error('Reschedule failed with status:', res.status);
        console.error('Response data:', responseData);
        alert(`Failed to reschedule conciliation: ${responseData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('=== FRONTEND RESCHEDULE ERROR ===');
      console.error('Error details:', err);
      alert(`Error rescheduling conciliation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Add onRemoveSession handler to ConciliationPage and pass to ViewConciliationModal
  const handleRemoveSession = async (idx: number) => {
    console.log('handleRemoveSession called with idx:', idx);
    if (!viewConciliation) {
      console.log('viewConciliation is null');
      return;
    }
    
    // Prevent removing the first session
    if (idx === 0) {
      console.log('Cannot remove first session');
      alert('You cannot remove the initial session.');
      return;
    }
    
    // Get the session to be deleted
    const sessionToDelete = viewConciliation.sessions[idx];
    console.log('Session to delete:', sessionToDelete);
    
    try {
      const response = await fetch(`http://localhost:5000/api/conciliation/session/${sessionToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('Session soft deleted successfully');
        
        // Refresh conciliation data
        const refreshResponse = await fetch("http://localhost:5000/api/conciliation");
        if (refreshResponse.ok) {
          const conciliationCases = await refreshResponse.json();
          
          // Group by complaint_id to create cases with multiple sessions
          const casesMap = new Map();
          
          conciliationCases.forEach((c: any) => {
            // Calculate days elapsed from scheduled date using helper function (like mediation)
          const daysElapsed = calculateTimeElapseFromSchedule([c]);
            const earliestCreatedAt = c.created_at;
            
            // Process reschedules to create sessions
            const sessions = [];
            
            if (c.reschedules && c.reschedules.length > 0) {
              const sortedReschedules = c.reschedules.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              
              sessions.push(...sortedReschedules.map((r: any) => ({
                id: r.id,
                schedule_date: r.reschedule_date || "",
                schedule_time: r.reschedule_time || "",
                conciliation_minutes: r.minutes || "",
                documentation: Array.isArray(r.documentation) ? r.documentation : (r.documentation ? JSON.parse(r.documentation) : []),
                reschedules: [],
                reason: r.reason || "",
              })));
            } else {
              sessions.push({
                id: c.id,
                schedule_date: c.date || "",
                schedule_time: c.time || "",
                conciliation_minutes: c.minutes || "",
                documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
                reschedules: [],
              });
            }
            
            const caseData = {
              id: c.id,
              complaint_id: c.complaint_id,
              case_title: c.case_title || "",
              complainants: c.complainant ? c.complainant.split(", ") : [],
              respondents: c.respondent ? c.respondent.split(", ") : [],
              time_elapse: c.time_elapse || "0/15",
              sessions: sessions,
              created_at: earliestCreatedAt,
              status: c.status || "",
              documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
            };
            
            casesMap.set(c.complaint_id, caseData);
          });
          
          const cases = Array.from(casesMap.values());
          setConciliationCases(cases);
          
          // Update viewConciliation with the refreshed data
          const updatedCase = cases.find(c => c.complaint_id === viewConciliation.complaint_id);
          if (updatedCase) {
            console.log('Updating viewConciliation with:', updatedCase);
            setViewConciliation(updatedCase);
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

  // Handle CFA PDF generation
  const handleGenerateCFA = async (complaintId: number, caseTitle: string) => {
    try {
      console.log('📄 Generating CFA PDF for case:', caseTitle);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:5000/api/pdf/generate-cfa', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for fallback auth
        body: JSON.stringify({ complaintId })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Clean case title for filename
        const cleanTitle = caseTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        a.download = `KP-Form-20B-CFA-${cleanTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ CFA PDF downloaded successfully');
      } else {
        console.error('Failed to download CFA PDF:', response.status);
        alert('Failed to download CFA PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading CFA PDF:', error);
      alert('Error downloading CFA PDF. Please try again.');
    }
  };

  const handleSaveSetArbitration = async (date: string, time: string, members: string[]) => {
    if (!selectedArbitrationCase) return;
    
    try {
      // Call the arbitration API to create the arbitration record
      const response = await fetch('http://localhost:5000/api/arbitration/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_id: selectedArbitrationCase.complaint_id,
          date: date,
          time: time,
          panel_members: members.filter(m => m.trim() !== '')
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule arbitration');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setShowArbitrationSuccess(true);
        setSelectedArbitrationCase(null);
        setShowSetArbitrationModal(false);
        
        // Refresh the conciliation data to reflect the updated status
        const response = await fetch("http://localhost:5000/api/conciliation");
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const casesMap = new Map();
          data.forEach((c: any) => {
            const sessions = c.reschedules || [];
            const earliestCreatedAt = sessions.length > 0 ? sessions[0].created_at : c.created_at;
            let daysElapsed = 0;
            if (earliestCreatedAt) {
              const today = new Date();
              const created = new Date(earliestCreatedAt);
              today.setHours(0,0,0,0);
              created.setHours(0,0,0,0);
              daysElapsed = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              if (daysElapsed < 0) daysElapsed = 0;
              if (daysElapsed > 15) daysElapsed = 15;
            }
            const caseData = {
              id: c.id,
              complaint_id: c.complaint_id,
              case_title: c.case_title,
              complainants: c.complainant ? [c.complainant] : [],
              respondents: c.respondent ? [c.respondent] : [],
              time_elapse: `${daysElapsed}/15`,
              sessions: sessions,
              created_at: earliestCreatedAt,
              status: c.status || "",
              documentation: Array.isArray(c.documentation) ? c.documentation : (c.documentation ? JSON.parse(c.documentation) : []),
            };
            casesMap.set(c.complaint_id, caseData);
          });
          const cases = Array.from(casesMap.values());
          setConciliationCases(cases);
        }
      } else {
        console.error('Failed to schedule arbitration:', result.error);
        alert('Failed to schedule arbitration. Please try again.');
      }
    } catch (error) {
      console.error('Error scheduling arbitration:', error);
      alert('Error scheduling arbitration. Please try again.');
    }
  };

  // Handle opening Forms modal
  const handleOpenFormsModal = (conciliation: ConciliationCase) => {
    setSelectedConciliationForForms(conciliation);
    setShowFormsModal(true);
  };

  // Handle PDF download for conciliation hearing form
  const handleDownloadConciliationPDF = async (conciliationCase: ConciliationCase) => {
    try {
      // Get the latest session data for this case
      const sortedSessions = getSortedSessions(conciliationCase.sessions);
      const latestSession = sortedSessions[sortedSessions.length - 1];
      
      if (!latestSession) {
        alert('No conciliation session data available for this case.');
        return;
      }

      // Prepare conciliation data for PDF generation
      const conciliationData = {
        complainant: conciliationCase.complainants.join(', '),
        respondent: conciliationCase.respondents.join(', '),
        case_title: conciliationCase.case_title,
        case_no: conciliationCase.complaint_id,
        date: latestSession.schedule_date,
        time: latestSession.schedule_time,
        minutes: latestSession.conciliation_minutes || 'No minutes recorded'
      };

      const response = await fetch('http://localhost:5000/api/pdf/generate-conciliation-hearing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conciliationData }),
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
      a.download = `Conciliation-Hearing-${conciliationCase.complaint_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading conciliation PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Handle downloading Notice to Choose Pangkat Member PDF (KP Form 11)
  const handleDownloadNoticeChoosePangkatPDF = async (conciliation: ConciliationCase, selectedMembers?: string[]) => {
    try {
      console.log('📄 Generating KP Form 11 (Notice to Choose Pangkat Member) PDFs for case:', conciliation.case_title);
      
      // Get Lupon panel members from the conciliation case or use selected members
      let panelMembers: string[] = [];
      
      if (selectedMembers && selectedMembers.length > 0) {
        // Use the selected members passed from the UI
        panelMembers = selectedMembers;
        console.log('📋 Using selected members:', panelMembers);
      } else {
        // Get all panel members from the conciliation case
        // Check for panel data from multiple sources
        if (conciliation.sessions && conciliation.sessions.length > 0 && conciliation.sessions[0].panel && conciliation.sessions[0].panel.length > 0) {
          panelMembers = conciliation.sessions[0].panel;
        }
        // If not in sessions, check if it exists in the main conciliation object (from lupon_panel field)
        else if ((conciliation as any).lupon_panel) {
          try {
            panelMembers = typeof (conciliation as any).lupon_panel === 'string' 
              ? JSON.parse((conciliation as any).lupon_panel) 
              : (conciliation as any).lupon_panel;
          } catch (e) {
            console.error('Error parsing lupon_panel:', e);
            panelMembers = [];
          }
        }
        console.log('📋 Using all panel members:', panelMembers);
      }
      
      if (!panelMembers || panelMembers.length === 0) {
        alert('No Lupon panel members found for this case. Please ensure the conciliation has been set with panel members.');
        return;
      }
      
      console.log('📋 Found', panelMembers.length, 'Lupon panel members:', panelMembers);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Debug: Log the complaint data being sent
      console.log('🔍 DEBUG - Conciliation data:', {
        complaint_id: conciliation.complaint_id,
        case_title: conciliation.case_title,
        complainant_id: (conciliation as any).complainant_id,
        respondent_id: (conciliation as any).respondent_id
      });
      
      // Generate KP Form 11 for all selected Lupon members
      const response = await fetch('http://localhost:5000/api/pdf/generate-notice-choose-pangkat', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for fallback auth
        body: JSON.stringify({ 
          complaintId: conciliation.complaint_id,
          luponMembers: panelMembers
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const cleanTitle = conciliation.case_title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        
        // If multiple members, indicate in filename
        const filename = panelMembers.length > 1 
          ? `KP-Form-11-Notice-Choose-Pangkat-Multiple-Members-${cleanTitle}.pdf`
          : `KP-Form-11-Notice-Choose-Pangkat-${panelMembers[0].replace(/[^a-zA-Z0-9]/g, '-')}-${cleanTitle}.pdf`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ KP Form 11 PDF(s) downloaded successfully for', panelMembers.length, 'members');
        
        // Show success message
        if (panelMembers.length > 1) {
          alert(`Successfully generated KP Form 11 (Notice to Choose Pangkat Member) for ${panelMembers.length} Lupon members:\n\n${panelMembers.join('\n')}\n\nNote: Individual forms for each member have been generated.`);
        } else {
          alert(`Successfully generated KP Form 11 (Notice to Choose Pangkat Member) for: ${panelMembers[0]}`);
        }
      } else {
        console.error('Failed to download KP Form 11 PDF:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        alert('Failed to download KP Form 11 PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading KP Form 11 PDF:', error);
      alert('Error downloading KP Form 11 PDF. Please try again.');
    }
  };

  // Handle downloading different types of conciliation PDFs
  const handleDownloadPDF = async (formType: string, conciliation: ConciliationCase, selectedMembers?: string[]) => {
    try {
      console.log('📄 Downloading PDF for form type:', formType, 'Case:', conciliation.case_title);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (formType === 'hearing') {
        // Use existing conciliation hearing PDF functionality
        await handleDownloadConciliationPDF(conciliation);
      } else if (formType === 'notice-constitution-pangkat') {
        // Handle Notice for Constitution of Pangkat PDF
        const response = await fetch('http://localhost:5000/api/pdf/generate-notice-constitution-pangkat', {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for fallback auth
          body: JSON.stringify({ complaintId: conciliation.complaint_id })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const cleanTitle = conciliation.case_title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
          a.download = `KP-Form-10-Notice-Constitution-Pangkat-${cleanTitle}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log('✅ Notice for Constitution of Pangkat PDF downloaded successfully');
        } else {
          console.error('Failed to download Notice PDF:', response.status);
          alert('Failed to download Notice for Constitution of Pangkat PDF. Please try again.');
        }
      } else if (formType === 'notice-choose-pangkat') {
        // Handle Notice to Choose Pangkat Member PDF (KP Form 11)
        await handleDownloadNoticeChoosePangkatPDF(conciliation);
      } else if (formType === 'notice-choose-pangkat-selected') {
        // Handle Notice to Choose Pangkat Member PDF for selected members (KP Form 11)
        await handleDownloadNoticeChoosePangkatPDF(conciliation, selectedMembers);
      } else {
        throw new Error(`Unknown form type: ${formType}`);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <ViewConciliationModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        conciliation={viewConciliation}
        onSeePhotos={(images: string[]) => {
          setSeePhotosImages(images);
          setShowSeePhotosModal(true);
        }}
        onRemoveSession={() => {}}
      />
      <SeePhotosModal open={showSeePhotosModal} onClose={() => setShowSeePhotosModal(false)} images={seePhotosImages} />
      <StartConciliationModal
        open={showStartModal}
        onClose={() => setShowStartModal(false)}
        conciliation={startConciliation}
        onSave={handleSaveConciliation}
        onReschedule={handleRescheduleConciliation}
        setShowSettlementSuccess={setShowSettlementSuccess}
      />
      {showStartSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Conciliation session saved successfully.</div>
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
            <div className="text-gray-700 mb-4 text-center">Conciliation session rescheduled successfully.</div>
            <button onClick={() => setShowRescheduleSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      <SetArbitrationModal
        open={showSetArbitrationModal}
        onClose={() => setShowSetArbitrationModal(false)}
        onSave={handleSaveSetArbitration}
        arbitrators={arbitrators}
        selectedCase={selectedArbitrationCase}
      />
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
      <SetArbitrationModalComplete
        open={showSetArbitrationModal}
        onClose={() => setShowSetArbitrationModal(false)}
        onSave={handleSaveSetArbitration}
        arbitrators={arbitrators}
        selectedCase={selectedArbitrationCase}
      />
      <CFAModal 
        open={showCFAModal} 
        onClose={() => {
          setShowCFAModal(false);
          setSelectedCFACase(null);
        }} 
        selectedCase={selectedCFACase}
        onGenerateCFA={handleGenerateCFA}
      />
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Conciliation Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Conciliation/s List</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {conciliationCases.length}
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
                  const rowKey = c.complaint_id + '-' + (c.conciliation_id ?? 'none') + '-' + idx;
                  return (
                    <tr key={rowKey} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
                            setViewConciliation(c);
                            setShowViewModal(true);
                          }}
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Start Conciliation"
                          onClick={() => { setStartConciliation(c); setShowStartModal(true); }}
                        >
                          <PlayCircleIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          className="text-amber-600 hover:text-amber-800"
                          title="Arbitration"
                          onClick={() => { setSelectedArbitrationCase(c); setShowSetArbitrationModal(true); }}
                          type="button"
                        >
                          <ScaleIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Certificate to File Action (CFA)"
                          onClick={() => {
                            setSelectedCFACase(c as ConciliationCase);
                            setShowCFAModal(true);
                          }}
                          type="button"
                        >
                          <DocumentTextIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                          onClick={() => handleOpenFormsModal(c as ConciliationCase)}
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
        conciliation={selectedConciliationForForms}
        handleDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
} 