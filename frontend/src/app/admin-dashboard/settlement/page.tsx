"use client";
import { useState, useEffect } from "react";
import { EyeIcon, XMarkIcon, DocumentTextIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import SearchAndSort from "../components/SearchAndSort";
import { applyFiltersAndSort } from "../components/searchUtils";

interface SettlementCase {
  id: number;
  complaint_id: number;
  settlement_type: 'mediation' | 'conciliation' | 'arbitration';
  settlement_date: string;
  case_title: string;
  complainants: string[];
  respondents: string[];
  agreements: string;
  remarks: string;
}

function ViewSettlementModal({ open, onClose, settlement }: { open: boolean, onClose: () => void, settlement: any }) {
  if (!open || !settlement) return null;
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
              <h2 className="text-2xl font-bold">Settlement Details</h2>
              <p className="text-blue-100 text-sm">Settlement ID #{settlement.id}</p>
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
                <div><span className="font-medium">Case No.:</span> {settlement.complaint_id}</div>
                <div><span className="font-medium">Settlement Type:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    settlement.settlement_type === 'mediation' ? 'bg-green-100 text-green-800' :
                    settlement.settlement_type === 'conciliation' ? 'bg-blue-100 text-blue-800' :
                    settlement.settlement_type === 'arbitration' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {settlement.settlement_type}
                  </span>
                </div>
                <div className="md:col-span-2"><span className="font-medium">Settlement Date:</span> {settlement.settlement_date ? new Date(settlement.settlement_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
              </div>
            </div>
            
            {/* Parties Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Complainant(s)
                </div>
                <div className="text-sm">{settlement.complainants.join(", ")}</div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Respondent(s)
                </div>
                <div className="text-sm">{settlement.respondents.join(", ")}</div>
              </div>
            </div>
            
            {/* Agreements Section */}
            <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Agreements
              </div>
              <div className="text-sm bg-blue-50 rounded-lg p-4 border border-blue-100">
                {settlement.agreements || 'No agreements recorded'}
              </div>
            </div>
            
            {/* Remarks Section */}
            {settlement.remarks && (
              <div className="bg-white rounded-2xl p-6 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-700 font-semibold">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Remarks
                </div>
                <div className="text-sm bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {settlement.remarks}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Settlement Forms Modal Props
interface SettlementFormsModalProps {
  open: boolean;
  onClose: () => void;
  settlement: SettlementCase | null;
  handleDownloadPDF: (formNo: number, settlement: SettlementCase) => void;
}

// Settlement Forms Modal Component
const SettlementFormsModal = ({ open, onClose, settlement, handleDownloadPDF }: SettlementFormsModalProps) => {
  if (!open || !settlement) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.2)", zIndex: 1000 }}>
      <div style={{ background: "#fff", margin: "40px auto", padding: 24, borderRadius: 8, maxWidth: 900, minHeight: 500, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #5b9bd5", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Printable Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[16].map((formNo) => {
            const formTitles = {
              16: "Amicable Settlement"
            };
            return (
              <div key={formNo} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
                <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#aaa" }}>[Preview]</span>
                </div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>KP Form No. {formNo}</div>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>{formTitles[formNo as keyof typeof formTitles]}</div>
                <button onClick={() => handleDownloadPDF(formNo, settlement)} style={{ width: "100%", background: "#5b9bd5", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }}>Download</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function SettlementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [filteredSettlements, setFilteredSettlements] = useState<SettlementCase[]>([]);
  const [settlementCases, setSettlementCases] = useState<SettlementCase[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewSettlement, setViewSettlement] = useState<any>(null);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementCase | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/settlement/")
      .then(res => res.json())
      .then(data => {
        console.log('Settlement data received:', data);
        
        if (!Array.isArray(data)) {
          console.error('Expected array from settlement API, got:', data);
          setSettlementCases([]);
          return;
        }
        
        const transformedData = data.map((s: any) => ({
          id: s.id,
          complaint_id: s.complaint_id,
          settlement_type: s.settlement_type,
          settlement_date: s.settlement_date,
          case_title: s.case_title || '',
          complainants: Array.isArray(s.complainants) ? s.complainants : (s.complainant ? s.complainant.split(", ") : []),
          respondents: Array.isArray(s.respondents) ? s.respondents : (s.respondent ? s.respondent.split(", ") : []),
          agreements: s.agreements || '',
          remarks: s.remarks || '',
        }));
        setSettlementCases(transformedData);
      })
      .catch(error => {
        console.error('Error fetching settlements:', error);
        setSettlementCases([]);
      });
  }, []);

  // Settlement status options for filtering
  const settlementStatusOptions = [
    { value: "all", label: "All Types" },
    { value: "mediation", label: "Mediation" },
    { value: "conciliation", label: "Conciliation" },
    { value: "arbitration", label: "Arbitration" },
  ];

  // Settlement sort options
  const settlementSortOptions = [
    { value: "date_desc", label: "Settlement Date (Newest)" },
    { value: "date_asc", label: "Settlement Date (Oldest)" },
    { value: "title_asc", label: "Case Title (A-Z)" },
    { value: "title_desc", label: "Case Title (Z-A)" },
    { value: "type", label: "Settlement Type" },
  ];

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let result = [...settlementCases];

    // Apply search filter
    if (searchQuery) {
      result = result.filter((item) => {
        const searchFields = ['case_title', 'complainants', 'respondents', 'agreements'];
        return searchFields.some(field => {
          const value = item[field as keyof SettlementCase];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          if (Array.isArray(value)) {
            return value.some((v: any) => {
              if (typeof v === 'string') {
                return v.toLowerCase().includes(searchQuery.toLowerCase());
              }
              return false;
            });
          }
          return false;
        });
      });
    }

    // Apply settlement type filter
    if (statusFilter !== "all") {
      result = result.filter((item) => {
        return item.settlement_type === statusFilter;
      });
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date(now);
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          result = result.filter((item) => {
            const itemDate = new Date(item.settlement_date || '');
            return itemDate >= filterDate;
          });
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          result = result.filter((item) => {
            const itemDate = new Date(item.settlement_date || '');
            return itemDate >= filterDate;
          });
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          result = result.filter((item) => {
            const itemDate = new Date(item.settlement_date || '');
            return itemDate >= filterDate;
          });
          break;
      }
    }
    
    // Apply sorting
    switch (sortBy) {
      case "date_desc":
        result.sort((a, b) => new Date(b.settlement_date || '').getTime() - new Date(a.settlement_date || '').getTime());
        break;
      case "date_asc":
        result.sort((a, b) => new Date(a.settlement_date || '').getTime() - new Date(b.settlement_date || '').getTime());
        break;
      case "title_asc":
        result.sort((a, b) => (a.case_title || '').localeCompare(b.case_title || ''));
        break;
      case "title_desc":
        result.sort((a, b) => (b.case_title || '').localeCompare(a.case_title || ''));
        break;
      case "type":
        result.sort((a, b) => (a.settlement_type || '').localeCompare(b.settlement_type || ''));
        break;
      default:
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    
    setFilteredSettlements(result);
  }, [settlementCases, searchQuery, statusFilter, dateFilter, sortBy]);

  const handleOpenFormsModal = (settlement: SettlementCase) => {
    setSelectedSettlement(settlement);
    setShowFormsModal(true);
  };

  const handleDownloadPDF = async (formNo: number, settlement: SettlementCase) => {
    try {
      let endpoint = '';
      let requestData = {};
      let filename = '';

      if (formNo === 16) {
        // KP Form 16 - Amicable Settlement
        const settlementData = {
          case_no: String(settlement.complaint_id),
          case_title: settlement.case_title || 'AMICABLE SETTLEMENT',
          complainants: settlement.complainants.join(', ') || 'N/A',
          respondents: settlement.respondents.join(', ') || 'N/A',
          settlement_date: settlement.settlement_date,
          agreements: settlement.agreements || '',
          settlement_type: settlement.settlement_type || '',
        };
        endpoint = 'http://localhost:5000/api/pdf/generate-settlement';
        requestData = { settlement: settlementData };
        filename = `KP-Form-16-${settlement.complaint_id}.pdf`;
      }

      if (endpoint) {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          alert('Failed to generate PDF');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };



  return (
    <div className="min-h-screen bg-gray-100">
      <ViewSettlementModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        settlement={viewSettlement}
      />
      <SettlementFormsModal
        open={showFormsModal}
        onClose={() => setShowFormsModal(false)}
        settlement={selectedSettlement}
        handleDownloadPDF={handleDownloadPDF}
      />
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Settlement Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow">
          <div className="bg-blue-400 rounded-t-xl px-6 py-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-lg font-semibold">Settlement/s List</span>
              <div className="flex items-center gap-2">
                <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                  Total Cases: {filteredSettlements.length}
                </span>
              </div>
            </div>
            <SearchAndSort
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              searchPlaceholder="Search by case title, complainant, respondent, or agreements..."
              statusOptions={settlementStatusOptions}
              sortOptions={settlementSortOptions}
              totalCount={filteredSettlements.length}
              title="Settlements"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-semibold">Case No.</th>
                  <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                  <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                  <th className="px-4 py-2 text-left font-semibold">Settlement Type</th>
                  <th className="px-4 py-2 text-left font-semibold">Settlement Date</th>
                  <th className="px-4 py-2 text-left font-semibold">Agreements</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                  <th className="px-4 py-2 text-left font-semibold">Forms</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlements.map((c, idx) => {
                  const formatDate = (dateStr: string) => {
                    if (!dateStr) return '—';
                    const date = new Date(dateStr);
                    return date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                  };
                  
                  const getSettlementTypeColor = (type: string) => {
                    switch (type) {
                      case 'mediation': return 'bg-green-100 text-green-800';
                      case 'conciliation': return 'bg-blue-100 text-blue-800';
                      case 'arbitration': return 'bg-purple-100 text-purple-800';
                      default: return 'bg-gray-100 text-gray-800';
                    }
                  };
                  
                  return (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.complaint_id}</td>
                      <td className="px-4 py-2">{c.complainants.join(", ")}</td>
                      <td className="px-4 py-2">{c.respondents.join(", ")}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSettlementTypeColor(c.settlement_type)}`}>
                          {c.settlement_type}
                        </span>
                      </td>
                      <td className="px-4 py-2">{formatDate(c.settlement_date)}</td>
                      <td className="px-4 py-2 max-w-xs truncate" title={c.agreements}>{c.agreements}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="View"
                          onClick={() => {
                            setViewSettlement(c);
                            setShowViewModal(true);
                          }}
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100"
                          onClick={() => handleOpenFormsModal(c)}
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
    </div>
  );
} 