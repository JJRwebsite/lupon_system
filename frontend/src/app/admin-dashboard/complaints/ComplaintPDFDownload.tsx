import React from "react";

interface Complaint {
  case_no: string;
  complainants: string;
  respondents: string;
  date_filed: string;
  case_description: string;
  relief?: string;
  relief_description: string;
  // Add other fields as needed
}

interface Props {
  complaint: Complaint;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const ComplaintPDFDownload: React.FC<Props> = ({ 
  complaint, 
  onDownloadStart, 
  onDownloadComplete, 
  onDownloadError 
}) => {
  const handleDownloadPDF = async () => {
    try {
      onDownloadStart?.();

      const response = await fetch('http://localhost:5000/api/pdf/generate-complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ complaint }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KP-Form-7-${complaint.case_no || 'complaint'}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onDownloadComplete?.();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      onDownloadError?.(error instanceof Error ? error.message : 'Failed to download PDF');
    }
  };

  return (
    <div className="pdf-download-container">
      <button
        onClick={handleDownloadPDF}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        Download PDF
      </button>
    </div>
  );
};

export default ComplaintPDFDownload;
