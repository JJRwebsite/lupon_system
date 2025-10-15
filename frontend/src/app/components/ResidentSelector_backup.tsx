"use client";
import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, PencilIcon, UserIcon, UsersIcon, IdentificationIcon } from "@heroicons/react/24/outline";

interface Resident {
  id: number;
  name: string;
  purok: string;
  contact: string;
  barangay: string;
}

interface ResidentSelectorProps {
  label: string;
  value: Resident | null;
  onChange: (resident: Resident | null) => void;
  required?: boolean;
  placeholder?: string;
}

export default function ResidentSelector({ label, value, onChange, required = false, placeholder }: ResidentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newResident, setNewResident] = useState({
    name: "",
    purok: "",
    contact: "",
    barangay: ""
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editResident, setEditResident] = useState({
    name: "",
    purok: "",
    contact: "",
    barangay: ""
  });

  // Search residents
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchResidents();
    } else {
      setResidents([]);
    }
  }, [searchQuery]);

  const searchResidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/residents/search?query=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setResidents(data);
      }
    } catch (error) {
      console.error('Error searching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResident = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newResident)
      });

      if (response.ok) {
        const data = await response.json();
        const createdResident = {
          id: data.resident_id,
          ...newResident
        };
        onChange(createdResident);
        setNewResident({ name: "", purok: "", contact: "", barangay: "" });
        setShowCreateForm(false);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error creating resident:', error);
    }
  };

  const handleSelectResident = (resident: Resident) => {
    onChange(resident);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  const handleEditResident = async () => {
    if (!value) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/residents/${value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editResident)
      });

      if (response.ok) {
        const updatedResident = {
          id: value.id,
          ...editResident
        };
        onChange(updatedResident);
        setShowEditForm(false);
      }
    } catch (error) {
      console.error('Error updating resident:', error);
    }
  };

  const handleStartEdit = () => {
    if (value) {
      setEditResident({
        name: value.name,
        purok: value.purok,
        contact: value.contact,
        barangay: value.barangay
      });
      setShowEditForm(true);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Selected resident display */}
      {value ? (
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
          <div>
            <div className="font-medium">{value.name}</div>
            <div className="text-sm text-gray-500">
              {value.purok && `Purok ${value.purok}, `}{value.barangay}
              {value.contact && ` • ${value.contact}`}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-blue-500 hover:text-blue-700"
              title="Edit resident information"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="text-red-500 hover:text-red-700"
              title="Clear selection"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full p-3 border border-gray-300 rounded-md text-left text-gray-500 hover:bg-gray-50"
        >
          {placeholder || `Select ${label.toLowerCase()}...`}
        </button>
      )}

      {/* Enhanced Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Enhanced Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 -mx-0 -mt-0 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    {label.toLowerCase().includes('complainant') ? (
                      <UserIcon className="h-6 w-6 text-white" />
                    ) : label.toLowerCase().includes('respondent') ? (
                      <UsersIcon className="h-6 w-6 text-white" />
                    ) : (
                      <IdentificationIcon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Select {label}</h3>
                    <p className="text-blue-100 text-sm mt-1">Search existing residents or create a new one</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/70 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 group"
                >
                  <XMarkIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>

            <div className="px-8 pb-6">
              {!showCreateForm ? (
                <>
                  {/* Enhanced Search Section */}
                  <div className="mb-6">
                    <div className="relative">
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search for ${label.toLowerCase()} by name...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-gray-50 focus:bg-white text-lg placeholder-gray-400"
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center">
                      <span>💡 Tip: Type at least 2 characters to search</span>
                    </div>
                  </div>

                  {/* Enhanced Create New Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="w-full p-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-600 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center transition-all duration-200 group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <PlusIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-blue-700">Create New {label}</div>
                          <div className="text-sm text-blue-500">Add a new resident to the system</div>
                        </div>
                      </div>
                    </button>
                  </div>

                {/* Search results */}
                <div className="max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                      <div className="text-sm text-gray-500">Searching...</div>
                    </div>
                  ) : residents.length > 0 ? (
                    <div className="space-y-2">
                      {residents.map((resident) => (
                        <button
                          key={resident.id}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <PlusIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-blue-700">Create New {label}</div>
                              <div className="text-sm text-blue-500">Add a new resident to the system</div>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Enhanced Search Results */}
                      <div className="space-y-3">
                        {/* Results Header */}
                        {searchQuery.length >= 2 && residents.length > 0 && (
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">
                              Found {residents.length} resident{residents.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-gray-500">Click to select</span>
                          </div>
                        )}

                        {/* Results List */}
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {residents.map((resident) => (
                            <div
                              key={resident.id}
                              onClick={() => handleSelectResident(resident)}
                              className="group p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {resident.name}
                                  </div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {resident.purok && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700 mr-2">
                                        Purok {resident.purok}
                                      </span>
                                    )}
                                    {resident.barangay && (
                                      <span className="text-gray-600">{resident.barangay}</span>
                                    )}
                                  </div>
                                  {resident.contact && (
                                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                      {resident.contact}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* No Results State */}
                        {searchQuery.length >= 2 && residents.length === 0 && !loading && (
                          <div className="text-center py-12 text-gray-500">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="text-lg font-medium text-gray-700 mb-2">No residents found</div>
                            <div className="text-sm text-gray-500 mb-4">Try searching with a different name or create a new resident</div>
                            <button
                              onClick={() => setShowCreateForm(true)}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Create New Resident
                            </button>
                          </div>
                        )}

                        {/* Search Prompt State */}
                        {searchQuery.length < 2 && (
                          <div className="text-center py-12 text-gray-400">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MagnifyingGlassIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="text-lg font-medium text-gray-600 mb-2">Search for residents</div>
                            <div className="text-sm text-gray-500">Enter at least 2 characters to start searching</div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Create resident form */
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <PlusIcon className="h-6 w-6 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Create New {label}</h4>
                        <p className="text-sm text-gray-500">Fill in the resident details</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newResident.name}
                            onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                            placeholder="Enter full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                          <input
                            type="text"
                            value={newResident.purok}
                            onChange={(e) => setNewResident(prev => ({ ...prev, purok: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                            placeholder="Enter purok"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                          <input
                            type="text"
                            value={newResident.contact}
                            onChange={(e) => setNewResident(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                            placeholder="Enter contact number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                          <input
                            type="text"
                            value={newResident.barangay}
                            onChange={(e) => setNewResident(prev => ({ ...prev, barangay: e.target.value }))}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                            placeholder="Enter barangay"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-4 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateResident}
                          disabled={!newResident.name.trim()}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit resident modal */}
          {showEditForm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit {label}</h3>
                    <p className="text-sm text-gray-500 mt-1">Update resident information</p>
                  </div>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <PlusIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Create New {label}</h4>
                  <p className="text-sm text-gray-500">Fill in the resident details</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newResident.name}
                      onChange={(e) => setNewResident(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                    <input
                      type="text"
                      value={newResident.purok}
                      onChange={(e) => setNewResident(prev => ({ ...prev, purok: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter purok"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                    <input
                      type="text"
                      value={newResident.contact}
                      onChange={(e) => setNewResident(prev => ({ ...prev, contact: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                    <input
                      type="text"
                      value={newResident.barangay}
                      onChange={(e) => setNewResident(prev => ({ ...prev, barangay: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Enter barangay"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateResident}
                    disabled={!newResident.name.trim()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Edit resident modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit {label}</h3>
                <p className="text-sm text-gray-500 mt-1">Update resident information</p>
              </div>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <PencilIcon className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Update Information</h4>
              <p className="text-sm text-gray-500">Modify the resident details</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editResident.name}
                  onChange={(e) => setEditResident(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                <input
                  type="text"
                  value={editResident.purok}
                  onChange={(e) => setEditResident(prev => ({ ...prev, purok: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter purok"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={editResident.contact}
                  onChange={(e) => setEditResident(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <input
                  type="text"
                  value={editResident.barangay}
                  onChange={(e) => setEditResident(prev => ({ ...prev, barangay: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter barangay"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditResident}
                disabled={!editResident.name.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
