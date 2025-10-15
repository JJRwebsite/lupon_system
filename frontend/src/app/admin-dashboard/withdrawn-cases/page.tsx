"use client";
import { useEffect, useState } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon, XMarkIcon, UserIcon, UsersIcon, IdentificationIcon } from "@heroicons/react/24/outline";

interface Complaint {
  id: number;
  case_title: string;
  complainants: { name: string }[];
  respondents: { name: string }[];
  status: string;
  date_withdrawn?: string;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr; // fallback if invalid
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
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const mins = String(minutes).padStart(2, '0');
  return `${hours}:${mins} ${ampm}`;
}

function ViewCaseModal({ open, onClose, caseData }: { open: boolean, onClose: () => void, caseData: any }) {
  if (!open || !caseData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-blue-200 my-16">
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-100 bg-blue-700 rounded-t-2xl">
          <span className="font-semibold text-lg text-white flex items-center gap-2"><DocumentTextIcon className="h-6 w-6 text-blue-200" /> Case Details</span>
          <button onClick={onClose} className="hover:bg-blue-100 rounded-full p-1 transition"><XMarkIcon className="h-6 w-6 text-white hover:text-blue-700" /></button>
        </div>
        <div className="space-y-6 px-6 py-4">
          {/* Case Details */}
          <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Case Information</div>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div><span className="font-medium">Case Title:</span> {caseData.case_title}</div>
              <div><span className="font-medium">Case Nature:</span> {caseData.nature_of_case || caseData.case_nature || ''}</div>
              <div><span className="font-medium">Case Description:</span> {caseData.case_description}</div>
              <div><span className="font-medium">Relief Description:</span> {caseData.relief_description}</div>
              <div><span className="font-medium">Status:</span> {caseData.status}</div>
              <div><span className="font-medium">Date Withdrawn:</span> {caseData.date_withdrawn ? formatDate(caseData.date_withdrawn) : '-'}</div>
              <div><span className="font-medium">Time Withdrawn:</span> {caseData.date_withdrawn ? formatTime(caseData.date_withdrawn) : '-'}</div>
            </div>
          </div>
          {/* Complainant Info */}
          <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UserIcon className="h-5 w-5" /> Complainant Information</div>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div><span className="font-medium">Names:</span> {caseData.complainants && caseData.complainants.map((c: any) => c.name).join(", ")}</div>
              {caseData.complainants && caseData.complainants[0] && (
                <>
                  {caseData.complainants[0].contact && <div><span className="font-medium">Contact:</span> {caseData.complainants[0].contact}</div>}
                  {caseData.complainants[0].purok && <div><span className="font-medium">Purok:</span> {caseData.complainants[0].purok}</div>}
                  {caseData.complainants[0].barangay && <div><span className="font-medium">Barangay:</span> {caseData.complainants[0].barangay}</div>}
                </>
              )}
            </div>
          </div>
          {/* Respondent Info */}
          <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Respondent Information</div>
            <div className="grid grid-cols-1 gap-1 text-sm">
              <div><span className="font-medium">Names:</span> {caseData.respondents && caseData.respondents.map((r: any) => r.name).join(", ")}</div>
              {caseData.respondents && caseData.respondents[0] && (
                <>
                  {caseData.respondents[0].contact && <div><span className="font-medium">Contact:</span> {caseData.respondents[0].contact}</div>}
                  {caseData.respondents[0].purok && <div><span className="font-medium">Purok:</span> {caseData.respondents[0].purok}</div>}
                  {caseData.respondents[0].barangay && <div><span className="font-medium">Barangay:</span> {caseData.respondents[0].barangay}</div>}
                </>
              )}
            </div>
          </div>
          {/* Witness Info */}
          {caseData.witnesses && caseData.witnesses.length > 0 && (
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Witness Information</div>
              <div className="grid grid-cols-1 gap-1 text-sm">
                <div><span className="font-medium">Names:</span> {caseData.witnesses.map((w: any) => w.name).join(", ")}</div>
                {caseData.witnesses[0] && (
                  <>
                    {caseData.witnesses[0].contact && <div><span className="font-medium">Contact:</span> {caseData.witnesses[0].contact}</div>}
                    {caseData.witnesses[0].purok && <div><span className="font-medium">Purok:</span> {caseData.witnesses[0].purok}</div>}
                    {caseData.witnesses[0].barangay && <div><span className="font-medium">Barangay:</span> {caseData.witnesses[0].barangay}</div>}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WithdrawnCasesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState<any>(null);

  useEffect(() => {
    const fetchWithdrawn = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/complaints/withdrawn");
        if (!res.ok) throw new Error("Failed to fetch withdrawn complaints");
        const data = await res.json();
        setComplaints(data);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchWithdrawn();
  }, []);



  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Withdrawn Case Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Withdrawn Complaints List</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {complaints.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : error ? (
              <div className="p-6 text-red-500">{error}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left font-semibold">Case No.</th>
                    <th className="px-4 py-2 text-left font-semibold">Case Title</th>
                    <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-2 text-left font-semibold">Date Withdrawn</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.id}</td>
                      <td className="px-4 py-2">{c.case_title}</td>
                      <td className="px-4 py-2">{c.complainants && c.complainants.map((com) => com.name).join(", ") || 'N/A'}</td>
                      <td className="px-4 py-2">{c.respondents && c.respondents.map((res) => res.name).join(", ") || 'N/A'}</td>
                      <td className="px-4 py-2">{c.date_withdrawn ? new Date(c.date_withdrawn).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:text-blue-800" title="View" onClick={() => { setViewComplaint(c); setShowViewModal(true); }}><EyeIcon className="h-5 w-5 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="flex justify-center items-center py-4">
            <button className="px-3 py-1 rounded-l bg-gray-200 text-blue-700 font-bold" disabled>{'«'}</button>
            <span className="px-4 py-1 bg-blue-600 text-white font-semibold rounded">1</span>
            <button className="px-3 py-1 rounded-r bg-gray-200 text-blue-700 font-bold" disabled>{'»'}</button>
          </div>
        </div>
      </div>
      {showViewModal && <ViewCaseModal open={showViewModal} onClose={() => setShowViewModal(false)} caseData={viewComplaint} />}
    </div>
  );
} 