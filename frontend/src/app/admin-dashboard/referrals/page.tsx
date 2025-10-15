"use client";
import { useEffect, useState } from "react";
import { EyeIcon, TrashIcon, XMarkIcon, DocumentTextIcon, UserIcon, UsersIcon, IdentificationIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";


interface Resident {
  id: number;
  name: string;
  purok: string;
  contact: string;
  barangay: string;
}

interface Referral {
  id: number;
  original_complaint_id: number;
  case_title: string;
  complainant: Resident | null;
  respondent: Resident | null;
  witness: Resident | null;
  case_description?: string;
  nature_of_case?: string;
  relief_sought?: string;
  incident_date?: string;
  incident_time?: string;
  incident_place?: string;
  referred_to: string;
  referral_reason: string;
  referred_by: string;
  date_referred: string;
  status: string;
  created_at: string;
}

function ViewReferralModal({ open, onClose, referralData }: { open: boolean, onClose: () => void, referralData: any }) {
  if (!open || !referralData) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-blue-200 my-16">
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-100 bg-blue-700 rounded-t-2xl">
          <span className="font-semibold text-lg text-white flex items-center gap-2">
            <DocumentTextIcon className="h-6 w-6 text-blue-200" /> Referral Details
          </span>
          <button onClick={onClose} className="hover:bg-blue-100 rounded-full p-1 transition">
            <XMarkIcon className="h-6 w-6 text-white hover:text-blue-700" />
          </button>
        </div>
        <div className="px-6 py-4">
          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Top Left - Case Information */}
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                <IdentificationIcon className="h-5 w-5" /> 
                Case Information
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Referral ID:</span> <span className="text-gray-900">#{referralData.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Original Case ID:</span> <span className="text-gray-900">#{referralData.original_complaint_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Case Title:</span> <span className="text-gray-900">{referralData.case_title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nature:</span> <span className="text-gray-900">{referralData.nature_of_case || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span> 
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ml-1 ${
                    referralData.status === 'referred' ? 'bg-blue-100 text-blue-800' :
                    referralData.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {referralData.status.charAt(0).toUpperCase() + referralData.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right - Complainant Information */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                <UserIcon className="h-5 w-5" /> 
                Complainant Information
              </div>
              {referralData.complainant ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{referralData.complainant.name}</span>
                  </div>
                  {referralData.complainant.contact && (
                    <div>
                      <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{referralData.complainant.contact}</span>
                    </div>
                  )}
                  {referralData.complainant.purok && (
                    <div>
                      <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{referralData.complainant.purok}</span>
                    </div>
                  )}
                  {referralData.complainant.barangay && (
                    <div>
                      <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{referralData.complainant.barangay}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No complainant information available</div>
              )}
            </div>

            {/* Bottom Left - Respondent Information */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                <UsersIcon className="h-5 w-5" /> 
                Respondent Information
              </div>
              {referralData.respondent ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{referralData.respondent.name}</span>
                  </div>
                  {referralData.respondent.contact && (
                    <div>
                      <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{referralData.respondent.contact}</span>
                    </div>
                  )}
                  {referralData.respondent.purok && (
                    <div>
                      <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{referralData.respondent.purok}</span>
                    </div>
                  )}
                  {referralData.respondent.barangay && (
                    <div>
                      <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{referralData.respondent.barangay}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No respondent information available</div>
              )}
            </div>

            {/* Bottom Right - Witness Information */}
            <div className="bg-white rounded-lg p-4 shadow border border-green-100">
              <div className="flex items-center gap-2 mb-3 text-green-700 font-semibold">
                <IdentificationIcon className="h-5 w-5" /> 
                Witness Information
              </div>
              {referralData.witness ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{referralData.witness.name}</span>
                  </div>
                  {referralData.witness.contact && (
                    <div>
                      <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{referralData.witness.contact}</span>
                    </div>
                  )}
                  {referralData.witness.purok && (
                    <div>
                      <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{referralData.witness.purok}</span>
                    </div>
                  )}
                  {referralData.witness.barangay && (
                    <div>
                      <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{referralData.witness.barangay}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No witness information available</div>
              )}
            </div>
          </div>

          {/* Full Width Sections */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Case Description</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{referralData.case_description || 'N/A'}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Relief Sought</h4>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{referralData.relief_sought || 'N/A'}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Referral Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Referred To:</span> <span className="text-blue-900">{referralData.referred_to}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Date Referred:</span> <span className="text-blue-900">{formatDate(referralData.date_referred)}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Referred By:</span> <span className="text-blue-900">{referralData.referred_by}</span>
                </div>
              </div>
              <div className="mt-3">
                <span className="font-medium text-blue-700">Reason for Referral:</span>
                <p className="text-blue-900 text-sm whitespace-pre-wrap mt-1">{referralData.referral_reason}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ open, onClose, onConfirm, referralData }: { open: boolean; onClose: () => void; onConfirm: () => void; referralData: any }) {
  if (!open || !referralData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-lg shadow-lg w-[400px] p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-lg">Confirm Deletion</span>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <TrashIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Delete Referral #{referralData.id}?</h3>
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this referral record? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewReferral, setViewReferral] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReferral, setDeleteReferral] = useState<any>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  
  const searchParams = useSearchParams();

  const fetchReferrals = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/referrals", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch referrals");
      const data = await res.json();
      setReferrals(data);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/referrals/${id}`, { 
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete referral");
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 2500);
      setReferrals(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Error deleting referral.");
    }
  };

  const handleDeleteClick = (referral: any) => {
    setDeleteReferral(referral);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteReferral) {
      handleDelete(deleteReferral.id);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  useEffect(() => {
    fetchReferrals();
    
    // Check for highlight parameter
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightId(parseInt(highlight));
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightId(null), 3000);
    }
  }, [searchParams]);



  return (
    <div className="min-h-screen bg-gray-100">
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Referral has been deleted.</div>
            <button onClick={() => setShowDeleteSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      
      <ViewReferralModal open={showViewModal} onClose={() => setShowViewModal(false)} referralData={viewReferral} />
      <DeleteConfirmationModal 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={confirmDelete}
        referralData={deleteReferral}
      />
      
      {/* Blue Header */}
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Referral Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        {/* Table Container */}
        <div className="bg-white rounded-xl shadow">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Referrals List</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {referrals.length}
              </span>
            </div>
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
                    <th className="px-4 py-2 text-left font-semibold">Referral ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Case Title</th>
                    <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-2 text-left font-semibold">Referred To</th>
                    <th className="px-4 py-2 text-left font-semibold">Date Referred</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r: Referral, idx: number) => (
                    <tr 
                      key={r.id} 
                      className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                        highlightId === r.id ? "bg-blue-100 border-2 border-blue-300" : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-medium">#{r.id}</td>
                      <td className="px-4 py-2">{r.case_title}</td>
                      <td className="px-4 py-2">{r.complainant?.name || 'N/A'}</td>
                      <td className="px-4 py-2">{r.respondent?.name || 'N/A'}</td>
                      <td className="px-4 py-2">{r.referred_to}</td>
                      <td className="px-4 py-2">{formatDate(r.date_referred)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          r.status === 'referred' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 mr-2" 
                          title="View" 
                          onClick={() => { setViewReferral(r); setShowViewModal(true); }}
                        >
                          <EyeIcon className="h-5 w-5 inline" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800" 
                          title="Delete" 
                          onClick={() => handleDeleteClick(r)}
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {referrals.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No referrals found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination */}
          <div className="flex justify-center items-center py-4">
            <button className="px-3 py-1 rounded-l bg-gray-200 text-blue-700 font-bold" disabled>{'«'}</button>
            <span className="px-4 py-1 bg-blue-600 text-white font-semibold rounded">1</span>
            <button className="px-3 py-1 rounded-r bg-gray-200 text-blue-700 font-bold" disabled>{'»'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
