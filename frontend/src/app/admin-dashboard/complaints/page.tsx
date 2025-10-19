"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { EyeIcon, PencilSquareIcon, TrashIcon, PlusCircleIcon, XMarkIcon, DocumentTextIcon, UserIcon, UsersIcon, IdentificationIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import ResidentSelector from "../../components/ResidentSelector";
import SearchAndSort from "../components/SearchAndSort";
import { applyFiltersAndSort, complaintStatusOptions } from "../components/searchUtils";

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

interface Complaint {
  id: number;
  case_title: string;
  complainant: Resident;
  respondent: Resident;
  witness?: Resident;
  status: string;
  case_description?: string;
  nature_of_case?: string;
  relief_description?: string;
  date_filed?: string;
}

// Types for case options
type CaseType = 'public_interest' | 'persons' | 'liberty_security' | 'property' | 'chastity' | 'honor';
type CaseTitleOptions = Record<CaseType, readonly string[]>;

// Nature case options with labels
const natureCaseOptions = [
  { value: "public_interest", label: "CRIME AGAINST PUBLIC INTEREST 📢" },
  { value: "persons", label: "CRIMES AGAINST PERSONS 👥" },
  { value: "liberty_security", label: "CRIMES AGAINST PERSONAL LIBERTY & SECURITY 🔒" },
  { value: "property", label: "CRIME AGAINST PROPERTY 💰" },
  { value: "chastity", label: "CRIMES AGAINST CHASTITY 👗" },
  { value: "honor", label: "CRIMES AGAINST HONOR 🎭" },
] as const;

// Case title options organized by case type
const caseTitleOptions: CaseTitleOptions = {
  public_interest: [
    "Alarms and scandals",
    "Using false certificate",
    "Using fictitious name and concealing true name",
    "Illegal use of uniforms and insignias"
  ] as const,
  persons: [
    "Physical injuries inflicted by tumultuous affray",
    "Giving assistance to suicide",
    "Less serious physical injuries",
    "Slight physical injuries and maltreatment"
  ] as const,
  liberty_security: [
    "Abandonment of persons in danger and abandonment of one's own victim",
    "Abandoning a minor",
    "Light threats",
    "Light coercion"
  ] as const,
  property: [
    "Theft",
    "Altering boundaries or landmarks",
    "Swindling or estafa",
    "Swindling a minor",
    "Removal, sale, or pledge of mortgaged property",
    "Special case of malicious mischief"
  ] as const,
  chastity: [
    "Simple seduction",
    "Acts of lasciviousness with consent of offended party"
  ] as const,
  honor: [
    "Threatening to publish and offer to prevent such publication for compensation",
    "Prohibiting publication of acts referred to in the course of official proceedings",
    "Slander",
    "Slander by deed",
    "Incriminating innocent persons",
    "Intriguing against honor",
    "Reckless imprudence"
  ] as const
};


function CreateComplaintModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [natureOfCase, setNatureOfCase] = useState("");
  const [reliefDescription, setReliefDescription] = useState("");

  // Use single parties only
  const [complainant, setComplainant] = useState<Resident | null>(null);
  const [respondent, setRespondent] = useState<Resident | null>(null);
  const [witness, setWitness] = useState<Resident | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const natureCaseOptions = [
    { 
      value: "public_interest", 
      label: "Crime Against Public Interest",
      labelCebuano: "Krimen batok sa Interes sa Publiko",
      icon: "📢", 
      description: "Cases involving public welfare and community interests",
      descriptionCebuano: "Mga kaso nga may kalabutan sa kayuhan sa komunidad ug interes sa publiko" 
    },
    { 
      value: "persons", 
      label: "Crimes Against Persons",
      labelCebuano: "Krimen batok sa Tawo",
      icon: "👥", 
      description: "Physical harm, assault, or threats to individuals",
      descriptionCebuano: "Pisikal nga kadaut, pagpangulata, o hulga batok sa indibidwal" 
    },
    { 
      value: "liberty_security", 
      label: "Crimes Against Personal Liberty & Security",
      labelCebuano: "Krimen batok sa Personal nga Kagawasan ug Seguridad",
      icon: "🔒", 
      description: "Unlawful detention, coercion, or security threats",
      descriptionCebuano: "Ilegal nga pagpugong, pagpamugos, o hulga sa seguridad" 
    },
    { 
      value: "property", 
      label: "Crime Against Property",
      labelCebuano: "Krimen batok sa Kabtangan",
      icon: "💰", 
      description: "Theft, damage, or disputes over property",
      descriptionCebuano: "Pagpangawat, kadaut, o lalis bahin sa kabtangan" 
    },
    { 
      value: "chastity", 
      label: "Crimes Against Chastity",
      labelCebuano: "Krimen batok sa Kaputli",
      icon: "👗", 
      description: "Cases involving moral and personal dignity",
      descriptionCebuano: "Mga kaso nga may kalabutan sa moral ug personal nga dignidad" 
    },
    { 
      value: "honor", 
      label: "Crimes Against Honor",
      labelCebuano: "Krimen batok sa Dungog",
      icon: "🎭", 
      description: "Defamation, libel, or reputation damage",
      descriptionCebuano: "Panlibak, libelo, o kadaut sa reputasyon" 
    },
  ];
  const caseTitleOptions: { [key: string]: string[] } = {
    public_interest: [
      "Alarms and scandals",
      "Using false certificate",
      "Using fictitious name and concealing true name",
      "Illegal use of uniforms and insignias"
    ],
    persons: [
      "Physical injuries inflicted by tumultuous affray",
      "Giving assistance to suicide",
      "Less serious physical injuries",
      "Slight physical injuries and maltreatment"
    ],
    liberty_security: [
      "Abandonment of persons in danger and abandonment of one's own victim",
      "Abandoning a minor",
      "Light threats",
      "Light coercion"
    ],
    property: [
      "Theft",
      "Altering boundaries or landmarks",
      "Swindling or estafa",
      "Swindling a minor",
      "Removal, sale, or pledge of mortgaged property",
      "Special case of malicious mischief"
    ],
    chastity: [
      "Simple seduction",
      "Acts of lasciviousness with consent of offended party"
    ],
    honor: [
      "Threatening to publish and offer to prevent such publication for compensation",
      "Prohibiting publication of acts referred to in the course of official proceedings",
      "Slander",
      "Slander by deed",
      "Incriminating innocent persons",
      "Intriguing against honor",
      "Reckless imprudence"
    ],
  };
  const caseTitleOptionsCebuano: { [key: string]: string[] } = {
    public_interest: [
      "Alarma ug eskandalo",
      "Paggamit og peke nga sertipiko",
      "Paggamit og binuhatang ngalan ug pagtago sa tinuod nga ngalan",
      "Ilegal nga paggamit sa uniporme ug insignia"
    ],
    persons: [
      "Pisikal nga kadaut tungod sa kagubot/bugno-bugno",
      "Pagtabang sa pagpakamatay",
      "Dili grabe nga pisikal nga kadaut",
      "Gagmayng kadaut sa lawas ug panamastamas"
    ],
    liberty_security: [
      "Pagbiya sa tawo nga anaa sa katalagman ug pagbiya sa kaugalingong biktima",
      "Pagbiya sa menor de edad",
      "Hinay nga hulga",
      "Hinay nga pagpamugos"
    ],
    property: [
      "Pagpangawat",
      "Pag-usab sa utlanan o timailhan",
      "Panikas o estafa",
      "Panikas batok sa menor de edad",
      "Pagkuha, pagbaligya, o pagpanuga sa gi-prenda nga kabtangan",
      "Espesyal nga kaso sa malisyosong kadaut"
    ],
    chastity: [
      "Yano nga pagpanghikayat",
      "Mahalay nga binuhatan nga adunay sugot sa napasakitan"
    ],
    honor: [
      "Pagpanulod nga ipatik ug paghalad nga dili ipatik kapalit sa bayad",
      "Pagdili sa pagpatik sa mga binuhatan nga hisgutan sa opisyal nga proseso",
      "Panlibak",
      "Panamastamas pinaagi sa buhat",
      "Pagpasangil sa walay sala",
      "Pag-intriga batok sa dungog",
      "Kawaláy pag-amping"
    ],
  };
  const [otherCaseTitle, setOtherCaseTitle] = useState("");

  function resetForm() {
    setCaseTitle(""); setCaseDescription(""); setNatureOfCase(""); setReliefDescription("");
    setComplainant(null);
    setRespondent(null);
    setWitness(null);
    setError("");
    setSuccess(false);
    setFieldErrors({});
  }

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!natureOfCase) errors.natureOfCase = 'Please select the nature of case';
    if (!caseTitle && caseTitle !== "other") errors.caseTitle = 'Please select a case title';
    if (caseTitle === "other" && !otherCaseTitle.trim()) errors.otherCaseTitle = 'Please enter a case title';
    if (!caseDescription.trim()) errors.caseDescription = 'Please provide a case description';
    if (!reliefDescription.trim()) errors.reliefDescription = 'Please describe the relief sought';
    if (!complainant) errors.complainant = 'Please select a complainant';
    if (!respondent) errors.respondent = 'Please select a respondent';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => { if (!open) resetForm(); }, [open]);

  // No handlers needed for single parties - direct state updates

  const handleComplaintSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError("Please complete all required fields correctly.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      // Create FormData to match the expected backend format
      const formData = new FormData();
      formData.append('case_title', caseTitle);
      formData.append('case_description', caseDescription);
      formData.append('nature_of_case', natureOfCase);
      formData.append('relief_description', reliefDescription);
      
      // Convert party objects to JSON strings as expected by backend
      if (complainant) {
        formData.append('complainant', JSON.stringify(complainant));
      }
      if (respondent) {
        formData.append('respondent', JSON.stringify(respondent));
      }
      if (witness) {
        formData.append('witness', JSON.stringify(witness));
      }
      

      
      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        credentials: 'include',
        body: formData, // Use FormData instead of JSON
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          resetForm();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to file complaint');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 bg-black/50 backdrop-blur-sm ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={`relative transition-all duration-300 transform ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} w-full max-w-4xl max-h-[90vh] overflow-hidden`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8" />
                <div>
                  <h2 className="text-xl font-bold">File a New Case</h2>
                  <p className="text-blue-100 text-sm">Create a new complaint for the Lupon Tagapamayapa</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4 rounded">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700 font-medium">Success!</p>
                  <p className="text-sm text-green-600">Complaint filed successfully. Redirecting...</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
            <form onSubmit={handleComplaintSubmit} className="p-6 space-y-8">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-1 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Case Details Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-6">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Case Details</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Nature of Case and Case Title - Same Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nature of Case <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          fieldErrors.natureOfCase ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        value={natureOfCase} 
                        onChange={e => { setNatureOfCase(e.target.value); setCaseTitle(""); setOtherCaseTitle(""); }}
                      >
                        <option value="">Select nature of case</option>
                        {natureCaseOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}{option.labelCebuano ? ` (${option.labelCebuano})` : ""}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.natureOfCase && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {fieldErrors.natureOfCase}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Case Title <span className="text-red-500">*</span>
                      </label>
                      <select 
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                          fieldErrors.caseTitle ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        value={caseTitle} 
                        onChange={e => setCaseTitle(e.target.value)} 
                        disabled={!natureOfCase}
                      >
                        <option value="">Select a case title</option>
                        {natureOfCase && (caseTitleOptions[natureOfCase] || []).map((title, _idx) => {
                          const cebu = (caseTitleOptionsCebuano[natureOfCase] || [])[_idx];
                          const display = cebu ? `${title} (${cebu})` : title;
                          return (
                            <option key={title} value={title}>{display}</option>
                          );
                        })}
                        {natureOfCase && <option value="other">Others (please specify)</option>}
                      </select>
                      {fieldErrors.caseTitle && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {fieldErrors.caseTitle}
                        </p>
                      )}
                      
                      {caseTitle === "other" && (
                        <div className="mt-3">
                          <input
                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                              fieldErrors.otherCaseTitle ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter custom case title"
                            value={otherCaseTitle}
                            onChange={e => setOtherCaseTitle(e.target.value)}
                          />
                          {fieldErrors.otherCaseTitle && (
                            <p className="mt-2 text-sm text-red-600 flex items-center">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                              {fieldErrors.otherCaseTitle}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Case Description and Relief Description - Same Row, Same Height */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Case Description <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea 
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                            fieldErrors.caseDescription ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                          }`}
                          value={caseDescription} 
                          onChange={e => setCaseDescription(e.target.value)} 
                          rows={5}
                          placeholder="Describe the details of the case..."
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {caseDescription.length}/500
                        </div>
                      </div>
                      {fieldErrors.caseDescription && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {fieldErrors.caseDescription}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relief Sought <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <textarea 
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
                            fieldErrors.reliefDescription ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                          }`}
                          value={reliefDescription} 
                          onChange={e => setReliefDescription(e.target.value)} 
                          rows={5}
                          placeholder="What resolution or remedy is being sought?"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {reliefDescription.length}/300
                        </div>
                      </div>
                      {fieldErrors.reliefDescription && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                          {fieldErrors.reliefDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parties Information Section */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-6">
                  <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Parties Involved</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Complainant */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <UserIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Complainant <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(The person filing the complaint)</span>
                      </label>
                    </div>
                    <ResidentSelector
                      label=""
                      value={complainant}
                      onChange={setComplainant}
                      required={true}
                      placeholder="Search and select the complainant..."
                    />
                    {fieldErrors.complainant && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {fieldErrors.complainant}
                      </p>
                    )}
                  </div>
                  
                  {/* Respondent */}
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <UserIcon className="h-5 w-5 text-red-600 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Respondent <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(The person being complained against)</span>
                      </label>
                    </div>
                    <ResidentSelector
                      label=""
                      value={respondent}
                      onChange={setRespondent}
                      required={true}
                      placeholder="Search and select the respondent..."
                    />
                    {fieldErrors.respondent && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                        {fieldErrors.respondent}
                      </p>
                    )}
                  </div>
                  
                  {/* Witness */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <IdentificationIcon className="h-5 w-5 text-green-600 mr-2" />
                      <label className="text-sm font-medium text-gray-700">
                        Witness <span className="text-gray-500">(Optional)</span>
                        <span className="text-xs text-gray-500 ml-2">(Someone who witnessed the incident)</span>
                      </label>
                    </div>
                    <ResidentSelector
                      label=""
                      value={witness}
                      onChange={setWitness}
                      required={false}
                      placeholder="Search and select a witness (optional)..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || success}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Filing Case...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Filed Successfully!
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      File Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EditComplaintModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  complaint: Complaint | null;
  onUpdate?: (updatedComplaint: Complaint) => void;
}

function EditComplaintModal({ open, onClose, onSuccess, complaint, onUpdate }: EditComplaintModalProps) {
  // Initialize state with empty values first
  const [caseTitle, setCaseTitle] = useState(complaint?.case_title || "");
  const [caseDescription, setCaseDescription] = useState(complaint?.case_description || "");
  const [natureOfCase, setNatureOfCase] = useState(complaint?.nature_of_case || "");
  const [reliefDescription, setReliefDescription] = useState(complaint?.relief_description || "");
  const [otherCaseTitle, setOtherCaseTitle] = useState("");
  const [complainant, setComplainant] = useState<Resident | null>(complaint?.complainant || null);
  const [respondent, setRespondent] = useState<Resident | null>(complaint?.respondent || null);
  const [witness, setWitness] = useState<Resident | null>(complaint?.witness || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Track previous open state to detect changes
  const prevOpenRef = useRef<boolean | undefined>(undefined);
  
  // Update state when complaint prop changes or modal is opened/closed
  useEffect(() => {
    // Only initialize when opening the modal with a complaint
    if (open && complaint && !isInitialized) {
      console.log('EditComplaintModal received complaint:', complaint);
      console.log('Complainant data:', complaint.complainant);
      console.log('Respondent data:', complaint.respondent);
      console.log('Witness data:', complaint.witness);
      
      setCaseTitle(complaint.case_title || "");
      setCaseDescription(complaint.case_description || "");
      setNatureOfCase(complaint.nature_of_case || "");
      setReliefDescription(complaint.relief_description || "");
      setOtherCaseTitle("");
      setComplainant(complaint.complainant || null);
      setRespondent(complaint.respondent || null);
      setWitness(complaint.witness || null);
      setError("");
      setIsInitialized(true);
    }
    
    // Reset form when modal is closed
    if (prevOpenRef.current && !open) {
      setCaseTitle("");
      setCaseDescription("");
      setNatureOfCase("");
      setReliefDescription("");
      setOtherCaseTitle("");
      setComplainant(null);
      setRespondent(null);
      setWitness(null);
      setError("");
      setIsInitialized(false);
    }
    
    // Update the previous open state
    prevOpenRef.current = open;
  }, [open, complaint]);





  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    if (!complaint) {
      setError("No complaint data available.");
      setSubmitting(false);
      return;
    }

    // Validate required fields
    if (!caseTitle || !caseDescription || !natureOfCase || !reliefDescription) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    // Validate that complainant and respondent are selected
    if (!complainant) {
      setError("Please select a complainant.");
      setSubmitting(false);
      return;
    }

    if (!respondent) {
      setError("Please select a respondent.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_title: caseTitle,
          case_description: caseDescription,
          nature_of_case: natureOfCase,
          relief_description: reliefDescription,
          complainant,
          respondent,
          witness,
        }),
      });
      if (!res.ok) throw new Error("Failed to update complaint");
      
      // Fetch the updated complaint data
      const updatedRes = await fetch(`http://localhost:5000/api/complaints/${complaint.id}`);
      if (updatedRes.ok) {
        const updatedComplaint = await updatedRes.json();
        // Update the complaint data in the parent component
        if (onUpdate) {
          onUpdate(updatedComplaint);
        }
      }
      
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
      <div className="relative bg-white rounded shadow-lg w-[65vw] h-[83vh] overflow-y-auto">
        <div className="bg-blue-700 text-white px-4 py-3 rounded-t flex justify-between items-center">
          <span className="font-semibold text-lg">Edit Complaint</span>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleUpdate} className="p-4 space-y-6">
          {/* Case Details */}
          <div>
            <div className="bg-blue-600 text-white px-3 py-2 rounded font-semibold mb-2">Case Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Nature of Case</label>
                <select className="w-full border rounded px-2 py-1 mb-2" value={natureOfCase} onChange={e => { setNatureOfCase(e.target.value); setCaseTitle(""); setOtherCaseTitle(""); }} required>
                  <option value="">Select Nature</option>
                  {natureCaseOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <label className="block text-sm font-medium">Case Title</label>
                <select className="w-full border rounded px-2 py-1" value={caseTitle} onChange={e => setCaseTitle(e.target.value)} required disabled={!natureOfCase}>
                  <option value="">Select Title</option>
                  {natureOfCase && (caseTitleOptions[natureOfCase as CaseType] || []).map((title) => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                  {natureOfCase && <option value="other">Others (please specify)</option>}
                  {natureOfCase && caseTitle && !(caseTitleOptions[natureOfCase as CaseType] || []).includes(caseTitle) && caseTitle !== "other" && (
                    <option value={caseTitle}>{caseTitle}</option>
                  )}
                </select>
                {caseTitle === "other" && (
                  <input
                    className="border rounded px-2 py-1 mt-2 w-full"
                    placeholder="Enter other case title"
                    value={otherCaseTitle}
                    onChange={e => setOtherCaseTitle(e.target.value)}
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Case Description</label>
                <textarea className="w-full border rounded px-2 py-1" value={caseDescription} onChange={e => setCaseDescription(e.target.value)} rows={3} required />
                <label className="block text-sm font-medium mt-2">Relief Description</label>
                <textarea className="w-full border rounded px-2 py-1" value={reliefDescription} onChange={e => setReliefDescription(e.target.value)} rows={3} required />
              </div>
            </div>
          </div>
          {/* Parties Information */}
          <div className="space-y-4">
            <div className="bg-blue-600 text-white px-3 py-2 rounded font-semibold mb-4">Parties Information</div>
            
            {/* Complainant */}
            <div>
              <ResidentSelector
                label="Complainant *"
                value={complainant}
                onChange={setComplainant}
                required={true}
                placeholder="Select complainant..."
              />
            </div>
            
            {/* Respondent */}
            <div>
              <ResidentSelector
                label="Respondent *"
                value={respondent}
                onChange={setRespondent}
                required={true}
                placeholder="Select respondent..."
              />
            </div>
            
            {/* Witness */}
            <div>
              <ResidentSelector
                label="Witness (Optional)"
                value={witness}
                onChange={setWitness}
                required={false}
                placeholder="Select witness..."
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex justify-center">
            <button type="submit" className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-8 py-2 rounded" disabled={submitting}>
              {submitting ? "Updating..." : "UPDATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper to format date as mm/dd/yy
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

interface ViewCaseModalProps {
  open: boolean;
  onClose: () => void;
  caseData: Complaint | null;
}

function ViewCaseModal({ open, onClose, caseData }: ViewCaseModalProps) {
  if (!open || !caseData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-blue-200 my-16">
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-100 bg-blue-700 rounded-t-2xl">
          <span className="font-semibold text-lg text-white flex items-center gap-2"><DocumentTextIcon className="h-6 w-6 text-blue-200" /> Case Details</span>
          <button onClick={onClose} className="hover:bg-blue-100 rounded-full p-1 transition"><XMarkIcon className="h-6 w-6 text-white hover:text-blue-700" /></button>
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
                  <span className="font-medium text-gray-700">Case Title:</span> <span className="text-gray-900">{caseData.case_title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Nature:</span> <span className="text-gray-900">{caseData.nature_of_case || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{caseData.status}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Date Filed:</span> <span className="text-gray-900">{formatDate(caseData.date_filed)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time Filed:</span> <span className="text-gray-900">{formatTime(caseData.date_filed)}</span>
                </div>
              </div>
            </div>

            {/* Top Right - Complainant Information */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                <UserIcon className="h-5 w-5" /> 
                Complainant Information
              </div>
              {caseData.complainant ? (
                <div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.complainant?.display_name || 'N/A'}</span>
                    </div>
                    {caseData.complainant?.contact && (
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.complainant?.contact}</span>
                      </div>
                    )}
                    {caseData.complainant?.purok && (
                      <div>
                        <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.complainant?.purok}</span>
                      </div>
                    )}
                    {caseData.complainant?.barangay && (
                      <div>
                        <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.complainant?.barangay}</span>
                      </div>
                    )}
                  </div>
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
              {caseData.respondent ? (
                <div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.respondent?.display_name || 'N/A'}</span>
                    </div>
                    {caseData.respondent?.contact && (
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.respondent.contact}</span>
                      </div>
                    )}
                    {caseData.respondent?.purok && (
                      <div>
                        <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.respondent.purok}</span>
                      </div>
                    )}
                    {caseData.respondent?.barangay && (
                      <div>
                        <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.respondent.barangay}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">No respondent information available</div>
              )}
            </div>

            {/* Bottom Right - Witness Information */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold">
                <IdentificationIcon className="h-5 w-5" /> 
                Witness Information
              </div>
              {caseData.witness ? (
                <div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.witness?.display_name || 'N/A'}</span>
                    </div>
                    {caseData.witness?.contact && (
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.witness.contact}</span>
                      </div>
                    )}
                    {caseData.witness?.purok && (
                      <div>
                        <span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.witness.purok}</span>
                      </div>
                    )}
                    {caseData.witness?.barangay && (
                      <div>
                        <span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.witness.barangay}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic flex items-center justify-center h-20">
                  No witness information available
                </div>
              )}
            </div>
          </div>

          {/* Full-width section for case and relief descriptions */}
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-gray-700 font-semibold">
              <DocumentTextIcon className="h-5 w-5" /> 
              Case & Relief Description
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700 block mb-1">Case Description:</span>
                <div className="text-sm text-gray-900 leading-relaxed">
                  {caseData.case_description || 'No description provided'}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700 block mb-1">Relief Description:</span>
                <div className="text-sm text-gray-900 leading-relaxed">
                  {caseData.relief_description || 'No relief description provided'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WithdrawConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  caseData: Complaint | null;
}

function WithdrawConfirmationModal({ open, onClose, onConfirm, caseData }: WithdrawConfirmationModalProps) {
  if (!open || !caseData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-lg shadow-lg w-[400px] p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-lg">Confirm Withdrawal</span>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Withdraw Case #{caseData.id}?</h3>
          <p className="text-gray-600 text-sm">
            Are you sure you want to withdraw this case? This action cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>Withdraw</button>
        </div>
      </div>
    </div>
  );
}

interface ReferralConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (referredTo: string, reason: string) => void;
  caseData: Complaint | null;
}

function ReferralConfirmationModal({ open, onClose, onConfirm, caseData }: ReferralConfirmationModalProps) {
  const [referredTo, setReferredTo] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!referredTo.trim() || !reason.trim()) {
      alert("Please fill in all fields");
      return;
    }
    setSubmitting(true);
    await onConfirm(referredTo, reason);
    setSubmitting(false);
    setReferredTo("");
    setReason("");
  };

  if (!open || !caseData) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
      <div className="relative bg-white rounded-lg shadow-lg w-[500px] p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-lg">Refer Case to External Agency</span>
          <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <div className="mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <ArrowRightIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-center">Refer Case #{caseData.id}?</h3>
          <p className="text-gray-600 text-sm text-center mb-4">
            This case will be removed from the Lupon system and transferred to the specified agency.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Refer to (Agency/Department) *
              </label>
              <input
                type="text"
                value={referredTo}
                onChange={(e) => setReferredTo(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Barangay Hall, Police Station, Court, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Referral *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="e.g., Case involves criminal matters, Outside Lupon jurisdiction, etc."
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" 
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Referring...' : 'Refer Case'}
          </button>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #5b9bd5", marginBottom: 24 }}>
          <span style={{ fontSize: 22, fontWeight: 500 }}>Printable Forms</span>
          <button onClick={onClose} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
          {[7, 8, 9].map((formNo: number) => {
            const formTitles: Record<number, string> = {
              7: "Complaint",
              8: "Notice of Hearing",
              9: "Summons"
            };
            return (
              <div key={formNo} style={{ border: "1px solid #888", borderRadius: 8, padding: 16, textAlign: "center", background: "#f9f9f9" }}>
                <div style={{ height: 80, marginBottom: 8, border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#aaa" }}>[Preview]</span>
                </div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>KP Form No. {formNo}</div>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#666" }}>{formTitles[formNo] || `Form ${formNo}`}</div>
                <button 
                  onClick={() => complaint && handleDownloadPDF(formNo, complaint)} 
                  style={{ width: "100%", background: "#5b9bd5", color: "#fff", border: "none", padding: 8, borderRadius: 4, fontWeight: 500, cursor: "pointer" }}
                  disabled={!complaint}
                >
                  Download
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState<Complaint | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editComplaint, setEditComplaint] = useState<Complaint | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawComplaint, setWithdrawComplaint] = useState<Complaint | null>(null);
  const [showFormsModal, setShowFormsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const router = useRouter();
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [showEditSuccess, setShowEditSuccess] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralComplaint] = useState<Complaint | null>(null);
  const [showReferralSuccess, setShowReferralSuccess] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/complaints");
      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${id}/withdraw`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to withdraw complaint");
      setShowWithdrawSuccess(true);
      setTimeout(() => setShowWithdrawSuccess(false), 2500);
      setComplaints(prev => prev.filter(c => c.id !== id));
    } catch {
      alert("Error withdrawing complaint.");
    }
  };

  const handleWithdrawClick = (complaint: Complaint) => {
    setWithdrawComplaint(complaint);
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = () => {
    if (withdrawComplaint) {
      handleWithdraw(withdrawComplaint.id);
      setShowWithdrawModal(false);
    }
  };


  const handleReferral = async (referredTo: string, reason: string) => {
    if (!referralComplaint) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/referrals/transfer/${referralComplaint.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          referred_to: referredTo,
          referral_reason: reason
        })
      });
      
      if (!res.ok) throw new Error("Failed to refer complaint");
      
      const result = await res.json();
      setShowReferralSuccess(true);
      setTimeout(() => setShowReferralSuccess(false), 2500);
      setComplaints(prev => prev.filter(c => c.id !== referralComplaint.id));
      setShowReferralModal(false);
      
      // Redirect to referrals page with the new referral ID
      setTimeout(() => {
        router.push(`/admin-dashboard/referrals?highlight=${result.referralId}`);
      }, 2500);
    } catch (err: unknown) {
      console.error('Error referring complaint:', err);
      alert("Error referring complaint.");
    }
  };

  const handleOpenFormsModal = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowFormsModal(true);
  };

  const handleDownloadPDF = async (formNo: number, complaint: Complaint) => {
    try {
      let endpoint = '';
      let requestData = {};
      let filename = '';

      if (formNo === 7) {
        // KP Form 7 - Complaint
        const complaintData = {
          case_no: String(complaint.id),
          case_title: complaint.case_title || '',
          complainants: complaint.complainant?.display_name || 'N/A',
          respondents: complaint.respondent?.display_name || 'N/A',
          date_filed: complaint.date_filed,
          case_description: complaint.case_description || complaint.case_title || "",
          relief_description: complaint.relief_description || "",
        };
        endpoint = 'http://localhost:5000/api/pdf/generate-complaint';
        requestData = { complaint: complaintData };
        filename = `KP-Form-7-${complaint.id || 'complaint'}.pdf`;
      } else if (formNo === 8) {
        // KP Form 8 - Notice of Hearing
        // First, fetch mediation schedule data for this complaint
        try {
          const mediationResponse = await fetch('http://localhost:5000/api/mediation');
          const mediations = await mediationResponse.json();
          const mediationSchedule = mediations.find((m: { complaint_id: number }) => m.complaint_id === complaint.id);
          
          const currentDate = new Date().toISOString().split('T')[0];
          let hearingDate = currentDate;
          let hearingTime = '09:00';
          
          // Use actual mediation schedule if available
          if (mediationSchedule) {
            hearingDate = mediationSchedule.date;
            hearingTime = mediationSchedule.time;
          } else {
            // Fallback to default (7 days from now) if no mediation scheduled
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            hearingDate = defaultDate.toISOString().split('T')[0];
          }
          
          const noticeData = {
            case_no: String(complaint.id),
            respondent_name: complaint.respondent?.display_name || 'N/A',
            hearing_date: hearingDate,
            hearing_time: hearingTime,
            notice_date: currentDate,
            complainant_name: complaint.complainant?.display_name || 'N/A',
            complainant_purok: complaint.complainant?.purok || '',
            complainant_barangay: complaint.complainant?.barangay || '',
            barangay: complaint.complainant?.barangay || '',
            notification_date: currentDate
          };
          endpoint = 'http://localhost:5000/api/pdf/generate-notice-hearing';
          requestData = { noticeData };
          filename = `KP-Form-8-Notice-${complaint.id || 'hearing'}.pdf`;
        } catch (mediationError) {
          console.error('Error fetching mediation schedule:', mediationError);
          // Fallback to default values if mediation fetch fails
          const currentDate = new Date().toISOString().split('T')[0];
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 7);
          
          const noticeData = {
            case_no: String(complaint.id),
            respondent_name: complaint.respondent?.display_name || 'N/A',
            hearing_date: defaultDate.toISOString().split('T')[0],
            hearing_time: '09:00',
            notice_date: currentDate,
            complainant_name: complaint.complainant?.display_name || 'N/A',
            complainant_purok: complaint.complainant?.purok || '',
            complainant_barangay: complaint.complainant?.barangay || '',
            barangay: complaint.complainant?.barangay || '',
            notification_date: currentDate
          };
          endpoint = 'http://localhost:5000/api/pdf/generate-notice-hearing';
          requestData = { noticeData };
          filename = `KP-Form-8-Notice-${complaint.id || 'hearing'}.pdf`;
        }
      } else if (formNo === 9) {
        // KP Form 9 - Summons
        // First, fetch mediation schedule data for this complaint
        try {
          const mediationResponse = await fetch('http://localhost:5000/api/mediation');
          const mediations = await mediationResponse.json();
          const mediationSchedule = mediations.find((m: { complaint_id: number }) => m.complaint_id === complaint.id);
          
          const currentDate = new Date().toISOString().split('T')[0];
          let hearingDate = currentDate;
          let hearingTime = '09:00';
          
          // Use actual mediation schedule if available
          if (mediationSchedule) {
            hearingDate = mediationSchedule.date;
            hearingTime = mediationSchedule.time;
          } else {
            // Fallback to default (7 days from now) if no mediation scheduled
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            hearingDate = defaultDate.toISOString().split('T')[0];
          }
          
          const summonsData = {
            case_no: String(complaint.id),
            case_title: complaint.case_title || '',
            complainant_name: complaint.complainant?.display_name || 'N/A',
            respondent_name: complaint.respondent?.display_name || 'N/A',
            respondent_purok: complaint.respondent?.purok || '',
            respondent_barangay: complaint.respondent?.barangay || '',
            case_nature: complaint.nature_of_case || complaint.case_title || '',
            barangay: complaint.complainant?.barangay || 'Ibabao',
            hearing_date: hearingDate,
            hearing_time: hearingTime,
            summons_date: currentDate
          };
          endpoint = 'http://localhost:5000/api/pdf/generate-summons';
          requestData = { summonsData };
          filename = `KP-Form-9-Summons-${complaint.id || 'summons'}.pdf`;
        } catch (mediationError) {
          console.error('Error fetching mediation schedule:', mediationError);
          // Fallback to default values if mediation fetch fails
          const currentDate = new Date().toISOString().split('T')[0];
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 7);
          
          const summonsData = {
            case_no: String(complaint.id),
            case_title: complaint.case_title || '',
            complainant_name: complaint.complainant?.display_name || 'N/A',
            respondent_name: complaint.respondent?.display_name || 'N/A',
            respondent_purok: complaint.respondent?.purok || '',
            respondent_barangay: complaint.respondent?.barangay || '',
            case_nature: complaint.nature_of_case || complaint.case_title || '',
            barangay: complaint.complainant?.barangay || 'Ibabao',
            hearing_date: defaultDate.toISOString().split('T')[0],
            hearing_time: '09:00',
            summons_date: currentDate
          };
          endpoint = 'http://localhost:5000/api/pdf/generate-summons';
          requestData = { summonsData };
          filename = `KP-Form-9-Summons-${complaint.id || 'summons'}.pdf`;
        }
      } else {
        throw new Error('Unsupported form number');
      }

      // Call backend PDF generation endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: unknown) {
      console.error('Error generating PDF:', error instanceof Error ? error.message : 'Unknown error');
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    const searchFields: (keyof Complaint)[] = ['case_title', 'complainant', 'respondent'];
    // First filter out pending cases
    const nonPendingComplaints = complaints.filter(complaint => 
      complaint.status.toLowerCase() !== 'pending'
    );
    const filtered = applyFiltersAndSort(
      nonPendingComplaints,
      { searchQuery, statusFilter, dateFilter, sortBy },
      searchFields
    );
    setFilteredComplaints(filtered);
  }, [complaints, searchQuery, statusFilter, dateFilter, sortBy]);

  return (
    <div className="min-h-screen bg-gray-100">
      {showCreateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been filed successfully.</div>
            <button onClick={() => setShowCreateSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showEditSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been updated successfully.</div>
            <button onClick={() => setShowEditSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showWithdrawSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been withdrawn.</div>
            <button onClick={() => setShowWithdrawSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
      {showReferralSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-blue-200">
            <ArrowRightIcon className="h-16 w-16 text-blue-500 mb-4" />
            <div className="text-blue-700 text-lg font-semibold mb-2">Case Referred!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been transferred to external agency.</div>
            <button onClick={() => setShowReferralSuccess(false)} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Close</button>
          </div>
        </div>
      )}
      <CreateComplaintModal open={showModal} onClose={() => setShowModal(false)} onSuccess={() => { fetchComplaints(); setShowCreateSuccess(true); }} />
      <EditComplaintModal 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={() => { fetchComplaints(); setShowEditSuccess(true); }} 
        complaint={editComplaint} 
        onUpdate={(updatedComplaint) => setEditComplaint(updatedComplaint)}
      />
      <ViewCaseModal open={showViewModal} onClose={() => setShowViewModal(false)} caseData={viewComplaint} />
      <WithdrawConfirmationModal 
        open={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)} 
        onConfirm={confirmWithdraw}
        caseData={withdrawComplaint}
      />
      <ReferralConfirmationModal 
        open={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
        onConfirm={handleReferral}
        caseData={referralComplaint}
      />
      <FormsModal
        open={showFormsModal}
        onClose={() => setShowFormsModal(false)}
        complaint={selectedComplaint}
        handleDownloadPDF={handleDownloadPDF}
      />
      {/* Blue Header */}
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Complaint Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        {/* Create Button */}
        <div className="flex justify-start mb-4">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow" onClick={() => setShowModal(true)}>
            <PlusCircleIcon className="h-5 w-5" />
            Create New Complaint
          </button>
        </div>
        {/* Table Container */}
        <div className="bg-white rounded-xl shadow">
          <div className="bg-blue-400 rounded-t-xl px-6 py-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-lg font-semibold">Complaints List</span>
              <div className="flex items-center gap-2">
                <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                  Total Cases: {filteredComplaints.length}
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
              searchPlaceholder="Search by case title, complainant, or respondent..."
              statusOptions={complaintStatusOptions}
              totalCount={filteredComplaints.length}
              title="Complaints"
            />
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
                    <th className="px-4 py-2 text-left font-semibold">Case No.</th>
                    <th className="px-4 py-2 text-left font-semibold">Case Title</th>
                    <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                    <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                    <th className="px-4 py-2 text-left font-semibold">Case Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                    <th className="px-4 py-2 text-left font-semibold">Forms</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c, idx) => (
                    <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-2">{c.id}</td>
                      <td className="px-4 py-2">{c.case_title}</td>
                      <td className="px-4 py-2">{c.complainant?.display_name || 'N/A'}</td>
                      <td className="px-4 py-2">{c.respondent?.display_name || 'N/A'}</td>
                      <td className="px-4 py-2">{(() => {
                        const s = c.status.replace(/_scheduled?$/i, "");
                        const formattedStatus = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
                        // Hide pending status
                        return formattedStatus.toLowerCase() === 'pending' ? '-' : formattedStatus;
                      })()}</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-600 hover:text-blue-800 mr-2" title="View" onClick={() => { setViewComplaint(c); setShowViewModal(true); }}><EyeIcon className="h-5 w-5 inline" /></button>
                        <button className="text-yellow-500 hover:text-yellow-700 mr-2" title="Edit" onClick={() => { setEditComplaint(c); setShowEditModal(true); }}><PencilSquareIcon className="h-5 w-5 inline" /></button>
                        <button className="text-red-600 hover:text-red-800" title="Withdraw" onClick={() => handleWithdrawClick(c)}><TrashIcon className="h-5 w-5 inline" /></button>
                      </td>
                      <td className="px-4 py-2">
                        <button className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100" onClick={() => handleOpenFormsModal(c as Complaint)}>Forms</button>
                      </td>
                    </tr>
                  ))}
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

