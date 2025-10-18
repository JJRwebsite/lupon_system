"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusIcon, XMarkIcon, UserIcon, PencilIcon } from "@heroicons/react/24/outline";

interface Resident {
  id: number;
  firstname: string;
  lastname: string;
  middlename?: string;
  display_name: string;
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
    firstname: "",
    lastname: "",
    middlename: "",
    purok: "",
    contact: "",
    barangay: ""
  });
  const [showEditForm, setShowEditForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [editResident, setEditResident] = useState({
    firstname: "",
    lastname: "",
    middlename: "",
    purok: "",
    contact: "",
    barangay: ""
  });

  // Role-specific icons and colors
  const getRoleConfig = () => {
    const role = label.toLowerCase();
    if (role.includes('complainant')) {
      return {
        icon: UserIcon,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600'
      };
    } else if (role.includes('respondent')) {
      return {
        icon: UserIcon,
        color: 'red',
        gradient: 'from-red-500 to-red-600'
      };
    } else if (role.includes('witness')) {
      return {
        icon: UserIcon,
        color: 'green',
        gradient: 'from-green-500 to-green-600'
      };
    }
    return {
      icon: UserIcon,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600'
    };
  };

  const roleConfig = getRoleConfig();
  const IconComponent = roleConfig.icon;

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
      const response = await fetch(`http://localhost:5000/api/residents/search?query=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResidents(data);
      }
    } catch (error) {
      console.error("Error searching residents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResident = (resident: Resident) => {
    onChange(resident);
    setIsOpen(false);
    setSearchQuery("");
    setShowCreateForm(false);
  };

  // Function to check for duplicate residents with all matching fields
  const checkForDuplicateResident = async (residentData: any) => {
    try {
      const response = await fetch("http://localhost:5000/api/residents");
      if (response.ok) {
        const allResidents = await response.json();
        
        // Normalize the input data for comparison
        const normalizedInput = {
          firstname: residentData.firstname.trim().toUpperCase(),
          lastname: residentData.lastname.trim().toUpperCase(),
          middlename: residentData.middlename.trim().toUpperCase(),
          purok: residentData.purok.trim().toUpperCase(),
          contact: residentData.contact.trim(),
          barangay: residentData.barangay.trim().toUpperCase()
        };
        
        // Check if any existing resident matches ALL fields
        const duplicateResident = allResidents.find((resident: Resident) => {
          const existingResident = {
            firstname: (resident.firstname || "").trim().toUpperCase(),
            lastname: (resident.lastname || "").trim().toUpperCase(),
            middlename: (resident.middlename || "").trim().toUpperCase(),
            purok: (resident.purok || "").trim().toUpperCase(),
            contact: (resident.contact || "").trim(),
            barangay: (resident.barangay || "").trim().toUpperCase()
          };
          
          return existingResident.firstname === normalizedInput.firstname &&
                 existingResident.lastname === normalizedInput.lastname &&
                 existingResident.middlename === normalizedInput.middlename &&
                 existingResident.purok === normalizedInput.purok &&
                 existingResident.contact === normalizedInput.contact &&
                 existingResident.barangay === normalizedInput.barangay;
        });
        
        return duplicateResident;
      }
    } catch (error) {
      console.error("Error checking for duplicates:", error);
    }
    return null;
  };

  const handleCreateResident = async () => {
    if (!newResident.firstname.trim() || !newResident.lastname.trim()) return;
    if (isCreating) return; // Prevent duplicate submissions

    setIsCreating(true);
    setValidationError(""); // Clear any previous validation errors
    
    try {
      // First, check for duplicate residents with all matching fields
      const duplicateResident = await checkForDuplicateResident(newResident);
      
      if (duplicateResident) {
        setValidationError(
          `A resident with the same information already exists: ${duplicateResident.display_name}. ` +
          `Please verify the details or select the existing resident instead.`
        );
        setIsCreating(false);
        return;
      }
      
      // Normalize data to prevent duplicates due to inconsistent formatting
      const normalizedResident = {
        firstname: newResident.firstname.trim().toUpperCase(),
        lastname: newResident.lastname.trim().toUpperCase(),
        middlename: newResident.middlename.trim().toUpperCase(),
        purok: newResident.purok.trim(),
        contact: newResident.contact.trim(),
        barangay: newResident.barangay.trim()
      };

      const response = await fetch("http://localhost:5000/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizedResident),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Create resident object from the form data and returned ID
          const createdResident = {
            id: result.resident_id,
            firstname: normalizedResident.firstname,
            lastname: normalizedResident.lastname,
            middlename: normalizedResident.middlename,
            display_name: result.display_name || `${normalizedResident.lastname}, ${normalizedResident.firstname}${normalizedResident.middlename ? ' ' + normalizedResident.middlename : ''}`,
            purok: normalizedResident.purok,
            contact: normalizedResident.contact,
            barangay: normalizedResident.barangay
          };
          onChange(createdResident);
          setIsOpen(false);
          setShowCreateForm(false);
          setNewResident({ firstname: "", lastname: "", middlename: "", purok: "", contact: "", barangay: "" });
        }
      } else {
        console.error("Failed to create resident:", response.statusText);
      }
    } catch (error) {
      console.error("Error creating resident:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditResident = async () => {
    if (!value || !editResident.firstname.trim() || !editResident.lastname.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/residents/${value.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editResident),
      });

      if (response.ok) {
        const updatedResident = await response.json();
        onChange(updatedResident);
        setShowEditForm(false);
      }
    } catch (error) {
      console.error("Error updating resident:", error);
    }
  };

  const openEditForm = () => {
    if (value) {
      setEditResident({
        firstname: value.firstname || "",
        lastname: value.lastname || "",
        middlename: value.middlename || "",
        purok: value.purok || "",
        contact: value.contact || "",
        barangay: value.barangay || "",
      });
      setShowEditForm(true);
    }
  };

  const clearSelection = () => {
    onChange(null);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected resident display */}
      {value && value.display_name ? (
        <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 bg-${roleConfig.color}-100 rounded-full flex items-center justify-center`}>
              <IconComponent className={`h-5 w-5 text-${roleConfig.color}-600`} />
            </div>
            <div>
              <div className="font-medium text-gray-900">{value.display_name}</div>
              <div className="text-sm text-gray-600">
                {value.purok && `Purok ${value.purok}, `}{value.barangay}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={openEditForm}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Edit resident"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Clear selection"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center"
        >
          <div className="flex items-center space-x-2">
            <IconComponent className="h-5 w-5" />
            <span>{placeholder || `Select ${label}`}</span>
          </div>
        </button>
      )}

      {/* Main selection modal */}
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100">
            {/* Enhanced Header with Gradient */}
            <div className={`bg-gradient-to-r ${roleConfig.gradient} px-8 py-6 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Select {label}</h3>
                    <p className="text-white/90 text-sm">Search for existing residents or create new ones</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateForm(false);
                    setSearchQuery("");
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-8 pb-6">
              {!showCreateForm ? (
                <>
                  {/* Enhanced Search Input */}
                  <div className="mb-6 -mt-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-white shadow-sm text-lg"
                        placeholder={`Search for ${label.toLowerCase()}...`}
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center space-x-4">
                      <span>💡 Tip: Enter at least 2 characters to search</span>
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

                  {/* Enhanced Search Results */}
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                        <div className="text-sm text-gray-500">Searching residents...</div>
                      </div>
                    ) : searchQuery.length >= 2 && residents.length > 0 ? (
                      <>
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                          <span className="text-sm font-medium text-gray-700">
                            Found {residents.length} resident{residents.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-gray-500">Click to select</span>
                        </div>

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
                                    {resident.display_name}
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
                      </>
                    ) : searchQuery.length >= 2 ? (
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
                    ) : (
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
                <div className="space-y-4 pt-4">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <PlusIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Create New {label}</h4>
                    <p className="text-sm text-gray-500">Fill in the resident details</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newResident.lastname}
                          onChange={(e) => {
                            setNewResident(prev => ({ ...prev, lastname: e.target.value }));
                            setValidationError(""); // Clear validation error when user types
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="Last name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newResident.firstname}
                          onChange={(e) => {
                            setNewResident(prev => ({ ...prev, firstname: e.target.value }));
                            setValidationError(""); // Clear validation error when user types
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Middle Name
                        </label>
                        <input
                          type="text"
                          value={newResident.middlename}
                          onChange={(e) => {
                            setNewResident(prev => ({ ...prev, middlename: e.target.value }));
                            setValidationError(""); // Clear validation error when user types
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="Middle name (optional)"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                      <input
                        type="text"
                        value={newResident.purok}
                        onChange={(e) => {
                          setNewResident(prev => ({ ...prev, purok: e.target.value }));
                          setValidationError(""); // Clear validation error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Enter purok"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                      <input
                        type="text"
                        value={newResident.contact}
                        onChange={(e) => {
                          setNewResident(prev => ({ ...prev, contact: e.target.value }));
                          setValidationError(""); // Clear validation error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Enter contact number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                      <select
                        value={newResident.barangay}
                        onChange={(e) => {
                          setNewResident(prev => ({ ...prev, barangay: e.target.value }));
                          setValidationError(""); // Clear validation error when user types
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                      >
                        <option value="">Select barangay</option>
                        <option value="Alegria">Alegria</option>
                        <option value="Bangbang">Bangbang</option>
                        <option value="Buagsong">Buagsong</option>
                        <option value="Catarman">Catarman</option>
                        <option value="Cogon">Cogon</option>
                        <option value="Dapitan">Dapitan</option>
                        <option value="Day-as">Day-as</option>
                        <option value="Gabi">Gabi</option>
                        <option value="Gilutongan">Gilutongan</option>
                        <option value="Ibabao">Ibabao</option>
                        <option value="Pilipog">Pilipog</option>
                        <option value="Poblacion">Poblacion</option>
                        <option value="San Miguel">San Miguel</option>
                      </select>
                    </div>
                  </div>

                  {/* Validation Error Display */}
                  {validationError && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-red-800">Duplicate Resident Found</h4>
                          <p className="text-sm text-red-700 mt-1">{validationError}</p>
                        </div>
                      </div>
                    </div>
                  )}

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
                      disabled={!newResident.firstname.trim() || !newResident.lastname.trim() || isCreating}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isCreating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Creating...</span>
                        </div>
                      ) : (
                        "Create"
                      )}
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editResident.lastname}
                    onChange={(e) => setEditResident(prev => ({ ...prev, lastname: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editResident.firstname}
                    onChange={(e) => setEditResident(prev => ({ ...prev, firstname: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={editResident.middlename}
                    onChange={(e) => setEditResident(prev => ({ ...prev, middlename: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                    placeholder="Middle name (optional)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purok</label>
                <input
                  type="text"
                  value={editResident.purok}
                  onChange={(e) => setEditResident(prev => ({ ...prev, purok: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  placeholder="Enter purok"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  value={editResident.contact}
                  onChange={(e) => setEditResident(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay</label>
                <input
                  type="text"
                  value={editResident.barangay}
                  onChange={(e) => setEditResident(prev => ({ ...prev, barangay: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200"
                  placeholder="Enter barangay"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-6 border-t border-gray-100 mt-6">
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
                disabled={!editResident.firstname.trim() || !editResident.lastname.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
