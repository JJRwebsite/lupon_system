"use client";
import { useState, useEffect } from "react";
import { UserIcon, UsersIcon, XMarkIcon, ListBulletIcon, PlusCircleIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ServerIcon } from "@heroicons/react/24/outline";

interface LuponMember {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  middlename: string;
  status: string;
  dateAdded: string;
  date_added: string;
}

interface DataState {
  chairperson: LuponMember[];
  members: LuponMember[];
  secretary: LuponMember[];
  [key: string]: LuponMember[]; // index signature for dynamic access
}

function AddModal({ open, onClose, onAdd, label }: { open: boolean, onClose: () => void, onAdd: (name: string) => void, label: string }) {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [middlename, setMiddlename] = useState("");
  
  const handleAdd = () => {
    if (firstname.trim() && lastname.trim()) {
      // Format: "LASTNAME, FIRSTNAME MIDDLENAME" (uppercase)
      const formattedName = `${lastname.trim().toUpperCase()}, ${firstname.trim().toUpperCase()}${middlename.trim() ? ' ' + middlename.trim().toUpperCase() : ''}`;
      onAdd(formattedName);
      setFirstname("");
      setLastname("");
      setMiddlename("");
      onClose();
    }
  };
  
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-blue-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blue-700">Add {label}</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-blue-700 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter last name"
              value={lastname}
              onChange={e => setLastname(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter first name"
              value={firstname}
              onChange={e => setFirstname(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter middle name (optional)"
              value={middlename}
              onChange={e => setMiddlename(e.target.value)}
            />
          </div>
        </div>
        
        <button
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-semibold w-full mt-6 transition-colors"
          onClick={handleAdd}
          disabled={!firstname.trim() || !lastname.trim()}
        >
          Add {label}
        </button>
      </div>
    </div>
  );
}

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function ListModal({ open, onClose, list, label, onEdit, onRemove }: { open: boolean, onClose: () => void, list: LuponMember[], label: string, onEdit: (idx: number) => void, onRemove: (idx: number) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-blue-200">
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-3xl">
          <h2 className="text-xl font-bold">{label} List</h2>
          <button onClick={onClose} className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="min-w-full text-sm border rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="px-3 py-2 border">ID</th>
                <th className="px-3 py-2 border">First Name</th>
                <th className="px-3 py-2 border">Last Name</th>
                <th className="px-3 py-2 border">Middle Name</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Date Added</th>
                <th className="px-3 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-blue-50 hover:bg-blue-100 transition"}>
                  <td className="px-3 py-2 border text-center font-semibold">{item.id}</td>
                  <td className="px-3 py-2 border">{item.firstname || '-'}</td>
                  <td className="px-3 py-2 border">{item.lastname || '-'}</td>
                  <td className="px-3 py-2 border">{item.middlename || '-'}</td>
                  <td className="px-3 py-2 border text-center"><span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold">{item.status || 'Active'}</span></td>
                  <td className="px-3 py-2 border text-center">{formatDisplayDate(item.date_added || item.dateAdded)}</td>
                  <td className="px-3 py-2 border text-center">
                    <button
                      className="p-1 hover:bg-blue-100 rounded-full mr-2"
                      title="Edit"
                      onClick={() => onEdit(idx)}
                    >
                      <PencilIcon className="h-5 w-5 text-blue-700" />
                    </button>
                    <button
                      className="p-1 hover:bg-red-100 rounded-full"
                      title="Remove"
                      onClick={() => onRemove(idx)}
                    >
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Success modal
function SuccessModal({ open, message, onClose }: { open: boolean, message: string, onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 border border-green-300 flex flex-col items-center">
        <div className="text-green-600 text-4xl mb-2">✓</div>
        <div className="text-lg font-semibold mb-4 text-center">{message}</div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold w-full" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

// Confirm modal
function ConfirmModal({ open, message, onConfirm, onCancel }: { open: boolean, message: string, onConfirm: () => void, onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 border border-red-300 flex flex-col items-center">
        <div className="text-red-600 text-4xl mb-2">!</div>
        <div className="text-lg font-semibold mb-4 text-center">{message}</div>
        <div className="flex gap-4 w-full">
          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold w-1/2" onClick={onCancel}>Cancel</button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold w-1/2" onClick={onConfirm}>Remove</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [data, setData] = useState<DataState>({
    chairperson: [],
    members: [],
    secretary: [],
  });
  const [showAdd, setShowAdd] = useState<{ type: string, open: boolean }>({ type: "", open: false });
  const [showList, setShowList] = useState<{ type: string, open: boolean }>({ type: "", open: false });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [successModal, setSuccessModal] = useState<{ open: boolean, message: string }>({ open: false, message: "" });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean, idx: number | null }>({ open: false, idx: null });
  const [backupSummary, setBackupSummary] = useState<any>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  // Fetch all lists from backend
  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const [chairpersonRes, membersRes, secretaryRes] = await Promise.all([
        fetch("http://localhost:5000/api/lupon-chairperson", { 
          credentials: "include",
          headers
        }),
        fetch("http://localhost:5000/api/lupon-members", { 
          credentials: "include",
          headers
        }),
        fetch("http://localhost:5000/api/lupon-secretary", { 
          credentials: "include",
          headers
        })
      ]);
      
      const [chairpersonData, membersData, secretaryData] = await Promise.all([
        chairpersonRes.json(),
        membersRes.json(),
        secretaryRes.json()
      ]);
      
      // Backend returns data directly as arrays, not wrapped in success object
      setData({
        chairperson: Array.isArray(chairpersonData) ? chairpersonData.map(item => ({
          id: item.id,
          name: item.name || item.display_name || '',
          firstname: item.firstname || '',
          lastname: item.lastname || '',
          middlename: item.middlename || '',
          status: item.status || 'Active',
          dateAdded: item.date_added || item.dateAdded,
          date_added: item.date_added || item.dateAdded
        })) : [],
        members: Array.isArray(membersData) ? membersData.map(item => ({
          id: item.id,
          name: item.name || item.display_name || '',
          firstname: item.firstname || '',
          lastname: item.lastname || '',
          middlename: item.middlename || '',
          status: item.status || 'Active',
          dateAdded: item.date_added || item.dateAdded,
          date_added: item.date_added || item.dateAdded
        })) : [],
        secretary: Array.isArray(secretaryData) ? secretaryData.map(item => ({
          id: item.id,
          name: item.name || item.display_name || '',
          firstname: item.firstname || '',
          lastname: item.lastname || '',
          middlename: item.middlename || '',
          status: item.status || 'Active',
          dateAdded: item.date_added || item.dateAdded,
          date_added: item.date_added || item.dateAdded
        })) : []
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      // Set empty arrays on error
      setData({
        chairperson: [],
        members: [],
        secretary: []
      });
    }
  };

  // Fetch backup summary
  const fetchBackupSummary = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:5000/api/backup/summary', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setBackupSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching backup summary:', error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchAll();
    fetchBackupSummary();
  }, []);

  const handleAdd = async (type: string, name: string) => {
    let url = "";
    if (type === "members") url = 'http://localhost:5000/api/lupon-members';
    else if (type === "chairperson") url = 'http://localhost:5000/api/lupon-chairperson';
    else if (type === "secretary") url = 'http://localhost:5000/api/lupon-secretary';
    if (!url) return;
    
    const today = new Date().toISOString().slice(0, 10);
    const token = localStorage.getItem('jwt_token');
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, status: 'Active', dateAdded: today }),
      });
      
      if (!res.ok) {
        let errMsg = `Failed to add ${type}.`;
        try {
          const err = await res.json();
          errMsg = err.error || errMsg;
        } catch {}
        alert(errMsg);
        return;
      }
      
      await fetchAll();
      setSuccessModal({ open: true, message: `${type === "members" ? "Lupon Member" : type === "chairperson" ? "Lupon Chairperson" : "Lupon Secretary"} added successfully!` });
    } catch (error) {
      console.error('Error adding item:', error);
      alert(`Failed to add ${type}. Please try again.`);
    }
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditName(data[showList.type as keyof typeof data][idx].name);
  };
  const handleEditSave = async () => {
    if (editIdx === null) return;
    const type = showList.type;
    const item = data[type][editIdx];
    let url = "";
    if (type === "members") url = `http://localhost:5000/api/lupon-members/${item.id}`;
    else if (type === "chairperson") url = `http://localhost:5000/api/lupon-chairperson/${item.id}`;
    else if (type === "secretary") url = `http://localhost:5000/api/lupon-secretary/${item.id}`;
    if (!url) return;
    
    const token = localStorage.getItem('jwt_token');
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      setEditIdx(null);
      setEditName("");
      await fetchAll();
      setSuccessModal({ open: true, message: `${showList.type === "members" ? "Lupon Member" : showList.type === "chairperson" ? "Lupon Chairperson" : "Lupon Secretary"} updated successfully!` });
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };
  const handleRemove = (idx: number) => {
    setConfirmModal({ open: true, idx });
  };
  const confirmRemove = async () => {
    if (confirmModal.idx === null) return;
    const idx = confirmModal.idx;
    const type = showList.type;
    const item = data[type][idx];
    let url = "";
    if (type === "members") url = `http://localhost:5000/api/lupon-members/${item.id}`;
    else if (type === "chairperson") url = `http://localhost:5000/api/lupon-chairperson/${item.id}`;
    else if (type === "secretary") url = `http://localhost:5000/api/lupon-secretary/${item.id}`;
    if (!url) return;
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    await fetchAll();
    
    // Trigger sync for conciliation and arbitration pages
    localStorage.setItem('lupon_roster_updated', Date.now().toString());
    
    setConfirmModal({ open: false, idx: null });
    setSuccessModal({ open: true, message: `${type === "members" ? "Lupon Member" : type === "chairperson" ? "Lupon Chairperson" : "Lupon Secretary"} removed successfully!` });
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const token = localStorage.getItem('jwt_token');
      const response = await fetch('http://localhost:5000/api/backup/full', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Create and download the SQL backup file
        const sqlContent = data.data.sqlDump;
        const blob = new Blob([sqlContent], { type: 'text/sql' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `lupon_system_backup_${timestamp}.sql`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccessModal({ 
          open: true, 
          message: `SQL backup completed successfully! ${data.data.statistics.totalRecords} records from ${data.data.statistics.totalTables} tables.` 
        });
        fetchBackupSummary(); // Refresh summary
      } else {
        alert('Backup failed: ' + data.message);
      }
    } catch (error) {
      console.error('Backup error:', error);
      alert('Backup failed: ' + (error instanceof Error ? error.message : 'Unknown error occurred'));
    } finally {
      setBackupLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchBackupSummary();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">Settings</div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl border border-blue-200 p-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-8 text-center">System Settings</h1>
          {/* Lupon Management Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Lupon Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chairperson */}
              <div className="border rounded-xl p-4 flex flex-col items-center">
                <div className="font-semibold mb-2">Lupon Chairperson</div>
                <UserIcon className="h-8 w-8 mb-2 text-blue-700" />
                <div className="mb-2">{data.chairperson.length}</div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded mb-2 flex items-center justify-center gap-1 py-1" onClick={() => setShowAdd({ type: "chairperson", open: true })}><PlusCircleIcon className="h-4 w-4" /> Add new</button>
                <button className="bg-white border border-blue-600 text-blue-700 w-full rounded flex items-center justify-center gap-1 py-1" onClick={() => setShowList({ type: "chairperson", open: true })}><ListBulletIcon className="h-4 w-4" /> View List</button>
              </div>
              {/* Members */}
              <div className="border rounded-xl p-4 flex flex-col items-center">
                <div className="font-semibold mb-2">Lupon Members</div>
                <UsersIcon className="h-8 w-8 mb-2 text-blue-700" />
                <div className="mb-2">{data.members.length}</div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded mb-2 flex items-center justify-center gap-1 py-1" onClick={() => setShowAdd({ type: "members", open: true })}><PlusCircleIcon className="h-4 w-4" /> Add new</button>
                <button className="bg-white border border-blue-600 text-blue-700 w-full rounded flex items-center justify-center gap-1 py-1" onClick={() => setShowList({ type: "members", open: true })}><ListBulletIcon className="h-4 w-4" /> View List</button>
              </div>
              {/* Secretary */}
              <div className="border rounded-xl p-4 flex flex-col items-center">
                <div className="font-semibold mb-2">Lupon Secretary</div>
                <UserIcon className="h-8 w-8 mb-2 text-blue-700" />
                <div className="mb-2">{data.secretary.length}</div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full rounded mb-2 flex items-center justify-center gap-1 py-1" onClick={() => setShowAdd({ type: "secretary", open: true })}><PlusCircleIcon className="h-4 w-4" /> Add new</button>
                <button className="bg-white border border-blue-600 text-blue-700 w-full rounded flex items-center justify-center gap-1 py-1" onClick={() => setShowList({ type: "secretary", open: true })}><ListBulletIcon className="h-4 w-4" /> View List</button>
              </div>
            </div>
          </div>

          {/* Database Backup Section */}
          <div className="border-t border-blue-200 pt-8">
            <h2 className="text-xl font-semibold text-blue-700 mb-4">Database Backup</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backup Information */}
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <ServerIcon className="h-6 w-6 text-blue-700 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-800">Backup Information</h3>
                </div>
                {backupSummary ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Tables:</span>
                      <span className="font-semibold text-blue-900">{backupSummary.totalTables}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Records:</span>
                      <span className="font-semibold text-blue-900">{backupSummary.totalRecords.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Database:</span>
                      <span className="font-semibold text-blue-900">{backupSummary.database}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Last Check:</span>
                      <span className="font-semibold text-blue-900">
                        {new Date(backupSummary.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-blue-600">Loading backup information...</div>
                )}
              </div>

              {/* Backup Actions */}
              <div className="bg-green-50 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <ArrowDownTrayIcon className="h-6 w-6 text-green-700 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">Backup Actions</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-green-700 text-sm">
                    Create a complete backup of all system data including users, cases, sessions, and settings.
                  </p>
                  <button
                    onClick={handleBackup}
                    disabled={backupLoading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                  >
                    {backupLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Download Full Backup
                      </>
                    )}
                  </button>
                  <p className="text-xs text-green-600">
                    Backup will be downloaded as a JSON file with timestamp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <AddModal
        open={showAdd.open}
        onClose={() => setShowAdd({ type: "", open: false })}
        onAdd={name => handleAdd(showAdd.type, name)}
        label={showAdd.type === "members" ? "Lupon Member" : showAdd.type === "chairperson" ? "Lupon Chairperson" : "Lupon Secretary"}
      />
      <ListModal
        open={showList.open}
        onClose={() => { setShowList({ type: "", open: false }); setEditIdx(null); setEditName(""); }}
        list={showList.type ? data[showList.type as keyof typeof data] : []}
        label={showList.type === "members" ? "Lupon Members" : showList.type === "chairperson" ? "Lupon Chairperson" : "Lupon Secretary"}
        onEdit={handleEdit}
        onRemove={handleRemove}
      />
      {/* Edit Modal */}
      {editIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-700">Edit Name</h2>
              <button onClick={() => { setEditIdx(null); setEditName(""); }} className="p-2 hover:bg-blue-100 rounded-full transition-all duration-200 group">
                <XMarkIcon className="h-6 w-6 text-blue-700 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <input
              className="border rounded px-3 py-2 w-full mb-4"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            <button
              className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold w-full"
              onClick={handleEditSave}
            >
              Save
            </button>
          </div>
        </div>
      )}
      {/* Success Modal */}
      <SuccessModal open={successModal.open} message={successModal.message} onClose={() => setSuccessModal({ open: false, message: "" })} />
      {/* Confirm Remove Modal */}
      <ConfirmModal open={confirmModal.open} message="Are you sure you want to remove this entry?" onConfirm={confirmRemove} onCancel={() => setConfirmModal({ open: false, idx: null })} />
    </div>
  );
} 