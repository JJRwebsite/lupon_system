"use client";
import { useEffect, useState, useRef } from "react";
import { EyeIcon, PlusCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

import { XMarkIcon, DocumentTextIcon, UserIcon, UsersIcon, IdentificationIcon } from "@heroicons/react/24/outline";

interface Complaint {
  id: number;
  case_title: string;
  complainants: { display_name: string }[];
  respondents: { display_name: string }[];
  status: string;
  user_id?: number;
  date_filed?: string;
  case_description?: string;
  relief_description?: string;
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

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const mins = String(minutes).padStart(2, '0');
  return `${hours}:${mins} ${ampm}`;
}

function ViewCaseModal({ open, onClose, caseData }: { open: boolean, onClose: () => void, caseData: any }) {
  if (!open || !caseData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-green-200 my-16">
        <div className="flex items-center justify-between px-6 py-4 border-b border-green-100 rounded-t-2xl" style={{ background: '#388e5c' }}>
          <span className="font-semibold text-lg text-white flex items-center gap-2"><DocumentTextIcon className="h-6 w-6 text-green-200" /> Case Details</span>
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
                <div><span className="font-medium text-gray-700">Case Title:</span> <span className="text-gray-900">{caseData.case_title}</span></div>
                <div><span className="font-medium text-gray-700">Case Nature:</span> <span className="text-gray-900">{caseData.nature_of_case || caseData.case_nature || 'N/A'}</span></div>
                <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{caseData.status}</span></div>
                <div><span className="font-medium text-gray-700">Date Filed:</span> <span className="text-gray-900">{formatDate(caseData.date_filed)}</span></div>
                <div><span className="font-medium text-gray-700">Time Filed:</span> <span className="text-gray-900">{formatTime(caseData.date_filed)}</span></div>
              </div>
            </div>

            {/* Top Right: Complainant Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <UserIcon className="h-5 w-5" /> Complainant Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Names:</span> <span className="text-gray-900">{caseData.complainants && caseData.complainants.map((c: any) => c.display_name).join(", ")}</span></div>
                {caseData.complainants && caseData.complainants[0] && (
                  <>
                    {caseData.complainants[0].contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.complainants[0].contact}</span></div>}
                    {caseData.complainants[0].purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.complainants[0].purok}</span></div>}
                    {caseData.complainants[0].barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.complainants[0].barangay}</span></div>}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Left: Respondent Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-500">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <UsersIcon className="h-5 w-5" /> Respondent Information
              </div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Names:</span> <span className="text-gray-900">{caseData.respondents && caseData.respondents.map((r: any) => r.display_name).join(", ")}</span></div>
                {caseData.respondents && caseData.respondents[0] && (
                  <>
                    {caseData.respondents[0].contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.respondents[0].contact}</span></div>}
                    {caseData.respondents[0].purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.respondents[0].purok}</span></div>}
                    {caseData.respondents[0].barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.respondents[0].barangay}</span></div>}
                  </>
                )}
              </div>
            </div>

            {/* Bottom Right: Witness Information */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100 border-l-4 border-l-green-400">
              <div className="flex items-center gap-2 mb-3 text-green-600 font-semibold">
                <IdentificationIcon className="h-5 w-5" /> Witness Information
              </div>
              <div className="space-y-2 text-sm">
                {caseData.witnesses && caseData.witnesses.length > 0 ? (
                  <>
                    <div><span className="font-medium text-gray-700">Names:</span> <span className="text-gray-900">{caseData.witnesses.map((w: any) => w.name).join(", ")}</span></div>
                    {caseData.witnesses[0] && (
                      <>
                        {caseData.witnesses[0].contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.witnesses[0].contact}</span></div>}
                        {caseData.witnesses[0].purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.witnesses[0].purok}</span></div>}
                        {caseData.witnesses[0].barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.witnesses[0].barangay}</span></div>}
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 italic">No witness information available for this case.</div>
                )}
              </div>
            </div>
          </div>

          {/* Full-width sections below grid */}
          <div className="space-y-4">
            {/* Case Description */}
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                <DocumentTextIcon className="h-5 w-5" /> Case Description
              </div>
              <div className="text-sm text-gray-900">
                {caseData.case_description || 'No description provided.'}
              </div>
            </div>

            {/* Relief Description */}
            <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                <DocumentTextIcon className="h-5 w-5" /> Relief Sought
              </div>
              <div className="text-sm text-gray-900">
                {caseData.relief_description || 'No relief description provided.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormsModalProps {
  open: boolean;
  onClose: () => void;
  complaint: Complaint | null;
  handleDownloadPDF: (formNo: number, complaint: Complaint) => void;
}

const FormsModal = ({ open, onClose, complaint, handleDownloadPDF }: FormsModalProps) => {
  if (!open || !complaint) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "#fff", margin: "40px auto", padding: 24, borderRadius: 8, maxWidth: 900, minHeight: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #22c55e", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Printable Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }} className="transition active:scale-95 sm:active:scale-100">&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[7].map((formNo) => (
            <div key={formNo} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
              <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#aaa" }}>[Preview]</span>
              </div>
              <div style={{ marginBottom: 8 }}>KP form no. {formNo}</div>
              <button onClick={() => handleDownloadPDF(formNo, complaint)} style={{ width: "100%", background: "#22c55e", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }} className="transition active:scale-95 sm:active:scale-100">Download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MyCasePage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState<any>(null);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/complaints/user-complaints", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFormsModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowFormsModal(true);
  };

  const handleDownloadPDF = async (formNo: number, complaint: Complaint) => {
    try {
      const response = await fetch('http://localhost:5000/api/pdf/generate-complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          case_no: String(complaint.id),
          complainants: complaint.complainants.map((c: any) => c.display_name).join(", "),
          respondents: complaint.respondents.map((r: any) => r.display_name).join(", "),
          date_filed: complaint.date_filed,
          case_description: complaint.case_description || complaint.case_title || "",
          relief_description: complaint.relief_description || "",
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `KP-Form-7-${complaint.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to generate PDF');
        alert('Failed to generate PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/current-user", { credentials: "include" });
        const data = await res.json();
        if (data.success) setUser(data.user);
      } catch {}
    }
    fetchUser();
  }, []);

  useEffect(() => { fetchComplaints(); }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = user ? complaints.filter((c: Complaint) => c.user_id === user.id) : [];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter((c: Complaint) =>
        c.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.complainants && Array.isArray(c.complainants) && c.complainants.some((com: { display_name: string }) => com.display_name.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (c.respondents && Array.isArray(c.respondents) && c.respondents.some((res: { display_name: string }) => res.display_name.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((c: Complaint) => c.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          result = result.filter((c: Complaint) => {
            const caseDate = new Date(c.date_filed || '');
            return caseDate >= filterDate;
          });
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          result = result.filter((c: Complaint) => {
            const caseDate = new Date(c.date_filed || '');
            return caseDate >= filterDate;
          });
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          result = result.filter((c: Complaint) => {
            const caseDate = new Date(c.date_filed || '');
            return caseDate >= filterDate;
          });
          break;
      }
    }
    
    // Apply sorting
    switch (sortBy) {
      case "date_desc":
        result.sort((a, b) => new Date(b.date_filed || '').getTime() - new Date(a.date_filed || '').getTime());
        break;
      case "date_asc":
        result.sort((a, b) => new Date(a.date_filed || '').getTime() - new Date(b.date_filed || '').getTime());
        break;
      case "title_asc":
        result.sort((a, b) => a.case_title.localeCompare(b.case_title));
        break;
      case "title_desc":
        result.sort((a, b) => b.case_title.localeCompare(a.case_title));
        break;
      case "status":
        result.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        result.sort((a, b) => b.id - a.id);
    }
    
    setFilteredComplaints(result);
  }, [complaints, user, searchQuery, statusFilter, dateFilter, sortBy]);

  // Computed value for active filters
  const hasActiveFilters = searchQuery || statusFilter !== "all" || dateFilter !== "all" || sortBy !== "date_desc";

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#388e5c] text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        My Cases
      </div>
      <div className="w-11/12 mx-auto mt-6">
        {/* Card Container */}
        <div className="bg-white rounded-xl shadow p-0">
          {/* Section Header */}
          <div className="flex items-center justify-between bg-[#388e5c] rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">My Cases</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-[#388e5c] px-3 py-1 rounded font-semibold">
                Total Cases: {filteredComplaints.length}
              </span>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm m-4">
            {/* Main Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Input - Takes up more space */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Compact Filters */}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[120px] transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="for_mediation">For Mediation</option>
                  <option value="for_conciliation">For Conciliation</option>
                  <option value="for_arbitration">For Arbitration</option>
                  <option value="settled">Settled</option>
                  <option value="resolved">Resolved</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>

                {/* Date Range Filter */}
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[110px] transition-colors"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[130px] transition-colors"
                >
                  <option value="date_desc">Newest</option>
                  <option value="date_asc">Oldest</option>
                  <option value="title_asc">A-Z</option>
                  <option value="title_desc">Z-A</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            {/* Filter Status and Clear Button */}
            {hasActiveFilters && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {[searchQuery, statusFilter !== "all", dateFilter !== "all", sortBy !== "date_desc"].filter(Boolean).length} filter{[searchQuery, statusFilter !== "all", dateFilter !== "all", sortBy !== "date_desc"].filter(Boolean).length !== 1 ? 's' : ''} active
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setDateFilter("all");
                    setSortBy("date_desc");
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              </div>
            )}
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : error ? (
              <div className="p-6 text-red-500">{error}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left font-semibold">case no.</th>
                    <th className="px-4 py-2 text-left font-semibold">case title</th>
                    <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-2 text-left font-semibold">Case Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.id}</td>
                      <td className="px-4 py-2">{c.case_title}</td>
                      <td className="px-4 py-2">{c.complainants && Array.isArray(c.complainants) ? c.complainants.map((com) => com.display_name).join(", ") : 'N/A'}</td>
                      <td className="px-4 py-2">{c.respondents && Array.isArray(c.respondents) ? c.respondents.map((res) => res.display_name).join(", ") : 'N/A'}</td>
                      <td className="px-4 py-2">{c.status}</td>
                      <td className="px-4 py-2">
                        <button className="bg-[#388e5c] text-white py-2 px-4 rounded-md border border-[#2d6e47] hover:bg-[#4a9d68] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold active:scale-95 sm:active:scale-100" title="View" onClick={() => { setViewComplaint(c); setShowViewModal(true); }}><EyeIcon className="h-5 w-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {/* Pagination */}
          <div className="flex justify-center items-center py-4">
            <button className="px-3 py-1 rounded-l bg-gray-200 text-[#388e5c] font-bold" disabled>{'«'}</button>
            <span className="px-4 py-1 bg-[#388e5c] text-white font-semibold rounded">1</span>
            <button className="px-3 py-1 rounded-r bg-gray-200 text-[#388e5c] font-bold" disabled>{'»'}</button>
          </div>
        </div>
      </div>
      {/* Modals */}
      <ViewCaseModal open={showViewModal} onClose={() => setShowViewModal(false)} caseData={viewComplaint} />

    </div>
  );
} 