"use client";
import { useState } from "react";
import { getToken } from "../../../utils/auth";
import * as XLSX from 'xlsx';

const REPORT_TYPES = [
  { value: "all", label: "All Cases" },
  { value: "mediation", label: "Mediation" },
  { value: "conciliation", label: "Conciliation" },
  { value: "arbitration", label: "Arbitration" },
  { value: "settlement", label: "Settlement" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [intervalType, setIntervalType] = useState("");
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Interval type options
  const INTERVAL_TYPES = [
    { value: "daily", label: "Daily (Specific Date)" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" }
  ];

  const handleDownloadExcel = async () => {
    if (!reportData || reportData.length === 0) {
      setError("No data available to export");
      return;
    }

    setDownloading(true);
    try {
      // Define columns for Excel export
      const baseColumns = [
        { key: 'id', label: 'ID' },
        { key: 'case_title', label: 'Case Title' },
        { key: 'complainant', label: 'Complainant' },
        { key: 'respondent', label: 'Respondent' },
        { key: 'witness', label: 'Witness' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' }
      ];

      // Add specific columns based on report type
      if (reportType === 'settlement') {
        baseColumns.push(
          { key: 'settlement_type', label: 'Settlement Type' },
          { key: 'settlement_date', label: 'Settlement Date' }
        );
      } else if (reportType === 'mediation' || reportType === 'conciliation' || reportType === 'arbitration') {
        baseColumns.push(
          { key: 'hearing_date', label: 'Hearing Date' },
          { key: 'lupon_member', label: 'Lupon Member' }
        );
      }

      // Prepare data for Excel export
      const excelData = reportData.map((row: any) => {
        const excelRow: any = {};
        
        // Map the data based on the columns structure
        baseColumns.forEach((column: any) => {
          let value = '';
          
          switch (column.key) {
            case 'id':
              value = row.id || row.case_id || '';
              break;
            case 'case_title':
              value = row.case_title || row.title || '';
              break;
            case 'complainant':
              if (row.complainants && Array.isArray(row.complainants) && row.complainants.length > 0) {
                value = getDisplayName(row.complainants[0]);
              } else {
                value = getDisplayName(row.complainant || row.complainant_name);
              }
              break;
            case 'respondent':
              if (row.respondents && Array.isArray(row.respondents) && row.respondents.length > 0) {
                value = getDisplayName(row.respondents[0]);
              } else {
                value = getDisplayName(row.respondent || row.respondent_name);
              }
              break;
            case 'witness':
              if (row.witnesses && Array.isArray(row.witnesses) && row.witnesses.length > 0) {
                value = getDisplayName(row.witnesses[0]);
              } else {
                value = getDisplayName(row.witness || row.witness_name);
              }
              break;
            case 'status':
              value = row.status || '';
              break;
            case 'date':
              value = formatDate(row.date_filed || row.date || row.created_at || row.settlement_date);
              break;
            default:
              value = row[column.key] || '';
              break;
          }
          
          excelRow[column.label] = value;
        });
        
        return excelRow;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better formatting
      const columnWidths = baseColumns.map(() => ({ wch: 20 }));
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      const sheetName = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `lupon_${reportType}_report_${timestamp}.xlsx`;

      // Download the file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export to Excel');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReportData([]);

    try {
      const token = getToken();
      let endpoint = "";

      switch (reportType) {
        case "mediation":
          endpoint = "/api/mediation/";
          break;
        case "conciliation":
          endpoint = "/api/conciliation/";
          break;
        case "arbitration":
          endpoint = "/api/arbitration/";
          break;
        case "settlement":
          endpoint = "/api/settlement/";
          break;
        case "withdrawn":
          endpoint = "/api/complaints/withdrawn";
          break;
        case "all":
        default:
          endpoint = "/api/complaints/";
          break;
      }

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      let data = await res.json();

      // Apply date filtering based on interval type
      if (date && intervalType) {
        const filterDate = new Date(date);
        let startDate: Date, endDate: Date;

        switch (intervalType) {
          case 'daily':
            startDate = new Date(filterDate);
            endDate = new Date(filterDate);
            endDate.setHours(23, 59, 59);
            break;
          case 'monthly':
            startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1);
            endDate = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0, 23, 59, 59);
            break;
          case 'quarterly':
            const quarter = Math.floor(filterDate.getMonth() / 3);
            startDate = new Date(filterDate.getFullYear(), quarter * 3, 1);
            endDate = new Date(filterDate.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
            break;
          case 'yearly':
            startDate = new Date(filterDate.getFullYear(), 0, 1);
            endDate = new Date(filterDate.getFullYear(), 11, 31, 23, 59, 59);
            break;
          default:
            startDate = new Date(filterDate);
            endDate = new Date(filterDate);
            endDate.setHours(23, 59, 59);
        }

        data = data.filter((item: any) => {
          const itemDate = new Date(item.created_at || item.date_filed || item.date || item.date_withdrawn || item.settlement_date);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      setReportData(data);
      setShowResults(true);

      if (data.length === 0) {
        setShowNoDataModal(true);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const getDisplayName = (nameObj: any) => {
    if (!nameObj) return "—";
    if (typeof nameObj === 'string' && nameObj.trim() !== '') return nameObj;
    if (nameObj.display_name) return nameObj.display_name;
    if (nameObj.first_name && nameObj.last_name) {
      return `${nameObj.first_name} ${nameObj.last_name}`;
    }
    return nameObj.name || "—";
  };

  const renderTable = () => {
    if (!showResults || reportData.length === 0) return null;

    const getColumns = () => {
      const baseColumns = [
        { key: 'id', label: 'ID', render: (row: any) => row.id || row.case_id || "—" },
        { key: 'case_title', label: 'Case Title', render: (row: any) => row.case_title || row.title || "—" },
        { key: 'complainant', label: 'Complainant', render: (row: any) => {
          // Handle different data formats from different endpoints
          if (row.complainants && Array.isArray(row.complainants) && row.complainants.length > 0) {
            return getDisplayName(row.complainants[0]);
          }
          return getDisplayName(row.complainant || row.complainant_name);
        }},
        { key: 'respondent', label: 'Respondent', render: (row: any) => {
          // Handle different data formats from different endpoints
          if (row.respondents && Array.isArray(row.respondents) && row.respondents.length > 0) {
            return getDisplayName(row.respondents[0]);
          }
          return getDisplayName(row.respondent || row.respondent_name);
        }},
        { key: 'witness', label: 'Witness', render: (row: any) => {
          // Handle different data formats from different endpoints
          if (row.witnesses && Array.isArray(row.witnesses) && row.witnesses.length > 0) {
            return getDisplayName(row.witnesses[0]);
          }
          return getDisplayName(row.witness || row.witness_name);
        }},
        { key: 'status', label: 'Status', render: (row: any) => row.status || "—" },
        { key: 'date', label: 'Date', render: (row: any) => formatDate(row.date_filed || row.date || row.created_at || row.settlement_date) }
      ];

      // Add specific columns based on report type
      if (reportType === 'settlement') {
        baseColumns.push(
          { key: 'settlement_type', label: 'Settlement Type', render: (row: any) => row.settlement_type || "—" },
          { key: 'settlement_date', label: 'Settlement Date', render: (row: any) => formatDate(row.settlement_date) }
        );
      } else if (reportType === 'mediation' || reportType === 'conciliation' || reportType === 'arbitration') {
        baseColumns.push(
          { key: 'session_date', label: 'Session Date', render: (row: any) => formatDate(row.date) },
          { key: 'time', label: 'Time', render: (row: any) => row.time || "—" }
        );
      }

      return baseColumns;
    };

    const columns = getColumns();

    return (
      <div className="mt-8 mx-4 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="relative flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Report Results</span>
            <span className="bg-blue-500/30 px-2 py-1 rounded-full text-sm font-medium">
              {reportData.length} {reportData.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <button 
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 backdrop-blur-sm border border-white/20 disabled:opacity-50 mr-8" 
            onClick={handleDownloadExcel}
            disabled={downloading}
          >
            {downloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Excel
              </>
            )}
          </button>
          {/* X Close Button - Top Right Corner */}
          <button 
            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl z-10" 
            onClick={() => {
              setShowResults(false);
              setReportData([]);
            }}
            title="Close Results"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData.map((row, idx) => (
                <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 transition-colors duration-150`}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-gray-800 whitespace-nowrap">
                      <span className="font-medium">
                        {column.render(row)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold">
        REPORTS
      </div>
      
      {/* Main container with wave background */}
      <div className="relative p-8 mx-4 mt-4 rounded-lg shadow-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 20%, #90caf9 40%, #64b5f6 60%, #42a5f5 80%, #2196f3 100%)'
      }}>
        {/* Wave SVG Background */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 1200 800" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,400 C200,300 400,500 600,400 C800,300 1000,500 1200,400 L1200,800 L0,800 Z" fill="#1976d2" fillOpacity="0.8"/>
            <path d="M0,450 C150,350 350,550 550,450 C750,350 950,550 1200,450 L1200,800 L0,800 Z" fill="#1565c0" fillOpacity="0.7"/>
            <path d="M0,500 C100,400 300,600 500,500 C700,400 900,600 1200,500 L1200,800 L0,800 Z" fill="#0d47a1" fillOpacity="0.6"/>
            <path d="M0,550 C250,450 450,650 650,550 C850,450 1050,650 1200,550 L1200,800 L0,800 Z" fill="#0277bd" fillOpacity="0.5"/>
            <path d="M0,600 C300,500 500,700 700,600 C900,500 1100,700 1200,600 L1200,800 L0,800 Z" fill="#01579b" fillOpacity="0.4"/>
          </svg>
        </div>
        <div className="relative p-6 max-w-md z-10">
          <div className="text-lg font-bold mb-2 drop-shadow-lg" style={{color: '#062E96', textShadow: '2px 2px 4px rgba(255,255,255,0.8)'}}>Generate List of Cases Report</div>
          <div className="text-sm mb-6 drop-shadow-lg" style={{color: '#413AA1', textShadow: '1px 1px 3px rgba(255,255,255,0.7)'}}>Please select the dates you want to generate</div>
          <form className="space-y-4" onSubmit={handleGenerate}>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              required
            >
              <option value="">Select Report Type</option>
              {REPORT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              value={intervalType}
              onChange={(e) => setIntervalType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              required
            >
              <option value="">Select Interval Type</option>
              {INTERVAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {intervalType === 'daily' && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                required
              />
            )}

            {intervalType === 'monthly' && (
              <input
                type="month"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                required
              />
            )}

            {intervalType === 'quarterly' && (
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                required
              >
                <option value="">Select Quarter</option>
                <option value="2024-01">Q1 2024</option>
                <option value="2024-04">Q2 2024</option>
                <option value="2024-07">Q3 2024</option>
                <option value="2024-10">Q4 2024</option>
                <option value="2025-01">Q1 2025</option>
                <option value="2025-04">Q2 2025</option>
                <option value="2025-07">Q3 2025</option>
                <option value="2025-10">Q4 2025</option>
              </select>
            )}

            {intervalType === 'yearly' && (
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
                required
              >
                <option value="">Select Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            )}

            <button
              type="submit"
              className="text-white px-4 py-2 rounded-md font-semibold w-full transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              style={{
                backgroundColor: '#062E96',
                border: '1px solid #413AA1'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#413AA1';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#062E96';
                }
              }}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate report"}
            </button>
          </form>
          {error && <div className="text-white bg-red-600 bg-opacity-80 mt-4 p-3 rounded-lg shadow-lg" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>{error}</div>}
        </div>
      </div>
      
      {renderTable()}
      
      {/* No Data Modal */}
      
        {showNoDataModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
              {/* Modal Content */}
              <div className="p-6 text-center">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  No records were found for the selected criteria. Please try different filters.
                </p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowNoDataModal(false)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowNoDataModal(false);
                      setReportType("");
                      setDate("");
                      setIntervalType("");
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    
  );
}
