"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircleIcon, 
  XMarkIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  UserIcon, 
  IdentificationIcon,
  ExclamationTriangleIcon,

} from "@heroicons/react/24/outline";
import ResidentSelector from "../../components/ResidentSelector";


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

export default function FileACasePage() {
  const [caseTitle, setCaseTitle] = useState("");
  const [otherCaseTitle, setOtherCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [natureOfCase, setNatureOfCase] = useState("");
  const [reliefDescription, setReliefDescription] = useState("");

  // Single parties
  const [complainant, setComplainant] = useState<Resident | null>(null);
  const [respondent, setRespondent] = useState<Resident | null>(null);
  const [witness, setWitness] = useState<Resident | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [hasOngoingCase, setHasOngoingCase] = useState(false);
  const [ongoingCaseDetails, setOngoingCaseDetails] = useState<any>(null);
  const [checkingOngoingCase, setCheckingOngoingCase] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [caseNumber, setCaseNumber] = useState<string>('');
  


  // Function to check if user has ongoing cases
  const checkOngoingCases = async (userId: number) => {
    try {
      // Check user complaints
      const complaintsRes = await fetch("http://localhost:5000/api/complaints/user-complaints", { 
        credentials: "include" 
      });
      const complaintsData = await complaintsRes.json();
      
      // Check user schedules (mediation, conciliation, arbitration sessions)
      const schedulesRes = await fetch("http://localhost:5000/api/complaints/user-schedules", { 
        credentials: "include" 
      });
      const schedulesData = await schedulesRes.json();
      
      let hasOngoing = false;
      let ongoingCase = null;
      
      if (complaintsData && Array.isArray(complaintsData)) {
        // Define settled/closed case statuses (only these allow new case filing)
        const settledStatuses = ['settled', 'resolved', 'withdrawn'];
        
        // Find any cases that are NOT settled/resolved/withdrawn
        const activeCases = complaintsData.filter((complaint: any) => 
          !settledStatuses.includes(complaint.status?.toLowerCase())
        );
        
        if (activeCases.length > 0) {
          hasOngoing = true;
          ongoingCase = activeCases[0];
        }
      }
      
      // Also check if user has any active sessions in mediation/conciliation/arbitration
      if (!hasOngoing && schedulesData && Array.isArray(schedulesData)) {
        // Check for any scheduled sessions that indicate ongoing processes
        const activeSessions = schedulesData.filter((schedule: any) => {
          const caseStatus = schedule.case_status?.toLowerCase();
          // If case has any scheduled sessions and is not settled/withdrawn, it's ongoing
          return caseStatus && !['settled', 'resolved', 'withdrawn'].includes(caseStatus);
        });
        
        if (activeSessions.length > 0) {
          hasOngoing = true;
          // Find the corresponding case details
          ongoingCase = {
            id: activeSessions[0].case_no,
            case_title: activeSessions[0].case_title,
            status: activeSessions[0].case_status,
            date_filed: activeSessions[0].date_filed,
            session_type: 'Active Session'
          };
        }
      }
      
      setHasOngoingCase(hasOngoing);
      setOngoingCaseDetails(ongoingCase);
      
    } catch (error) {
      console.error('Error checking ongoing cases:', error);
      // On error, allow filing (fail open for better UX)
      setHasOngoingCase(false);
    } finally {
      setCheckingOngoingCase(false);
    }
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("http://localhost:5000/api/current-user", { credentials: "include" });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          // Check for ongoing cases after getting user info
          await checkOngoingCases(data.user.id);
        }
      } catch {
        setCheckingOngoingCase(false);
      }
    }
    fetchUser();
  }, []);

  const natureCaseOptions = [
    { 
      value: "public_interest", 
      label: "Crime Against Public Interest", 
      icon: "📢", 
      description: "Cases involving public welfare and community interests" 
    },
    { 
      value: "persons", 
      label: "Crimes Against Persons", 
      icon: "👥", 
      description: "Physical harm, assault, or threats to individuals" 
    },
    { 
      value: "liberty_security", 
      label: "Crimes Against Personal Liberty & Security", 
      icon: "🔒", 
      description: "Unlawful detention, coercion, or security threats" 
    },
    { 
      value: "property", 
      label: "Crime Against Property", 
      icon: "💰", 
      description: "Theft, damage, or disputes over property" 
    },
    { 
      value: "chastity", 
      label: "Crimes Against Chastity", 
      icon: "👗", 
      description: "Cases involving moral and personal dignity" 
    },
    { 
      value: "honor", 
      label: "Crimes Against Honor", 
      icon: "🎭", 
      description: "Defamation, libel, or reputation damage" 
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



  const resetForm = () => {
    setCaseTitle("");
    setOtherCaseTitle("");
    setCaseDescription("");
    setNatureOfCase("");
    setReliefDescription("");
    setComplainant(null);
    setRespondent(null);
    setWitness(null);
    setError("");
    setSuccess(false);
    setFieldErrors({});
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!natureOfCase) errors.natureOfCase = 'Please select the nature of case';
    if (!caseTitle && caseTitle !== "other") errors.caseTitle = 'Please select a case title';
    if (caseTitle === "other" && !otherCaseTitle.trim()) errors.otherCaseTitle = 'Please enter a case title';
    if (!caseDescription.trim()) errors.caseDescription = 'Please provide a case description';
    if (!reliefDescription.trim()) errors.reliefDescription = 'Please describe the relief sought';
    if (!complainant) errors.complainant = 'Please select a complainant';
    if (!respondent) errors.respondent = 'Please select a respondent';
    
    // Check for duplicate residents
    if (complainant && respondent && complainant.id === respondent.id) {
      errors.respondent = 'Respondent cannot be the same person as the complainant';
    }
    if (complainant && witness && complainant.id === witness.id) {
      errors.witness = 'Witness cannot be the same person as the complainant';
    }
    if (respondent && witness && respondent.id === witness.id) {
      errors.witness = 'Witness cannot be the same person as the respondent';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user has ongoing case (admin bypass)
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';
    if (hasOngoingCase && !isAdmin) {
      setError("You cannot file a new case while you have an ongoing or unsettled case. Please wait for your current case to be resolved.");
      return;
    }
    
    if (!validateForm()) {
      setError("Please complete all required fields correctly.");
      return;
    }
    
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      // Prepare form data for submission
      const finalCaseTitle = caseTitle === "other" ? otherCaseTitle : caseTitle;
      const formData = new FormData();
      
      // Add form data
      formData.append('case_title', finalCaseTitle);
      formData.append('case_description', caseDescription);
      formData.append('nature_of_case', natureOfCase);
      formData.append('relief_description', reliefDescription);
      formData.append('complainant', JSON.stringify(complainant));
      formData.append('respondent', JSON.stringify(respondent));
      formData.append('witness', JSON.stringify(witness));
      if (user) formData.append('user_id', user.id.toString());

      const response = await fetch("http://localhost:5000/api/complaints", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        setSuccess(true);
        setCaseNumber(responseData.caseId || responseData.id || 'Unknown');
        setShowSuccessModal(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to file complaint");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-[#388e5c] text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        File a New Case
      </div>
      <div className="w-11/12 mx-auto mt-6">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800 mb-1">
                  Validation Error
                </h3>
                <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Please correct the issue and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-[#388e5c] rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold flex items-center">
              <DocumentTextIcon className="h-6 w-6 mr-2" />
              Case Information
            </span>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Loading State */}
              {checkingOngoingCase && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                    <p className="text-sm text-blue-700">Checking for ongoing cases...</p>
                  </div>
                </div>
              )}

              {/* Ongoing Case Warning */}
              {hasOngoingCase && !checkingOngoingCase && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-800 mb-2">
                        {user?.role === 'admin' || user?.role === 'secretary' 
                          ? '⚠️ Admin Override: User has ongoing case' 
                          : '⚠️ Cannot File New Case'}
                      </h4>
                      <p className="text-sm text-amber-700 mb-3">
                        {user?.role === 'admin' || user?.role === 'secretary'
                          ? 'This user has an ongoing case or active session. As an admin, you can still file a new case, but please verify this is intentional.'
                          : 'You currently have an ongoing case or active session in mediation, conciliation, or arbitration. Please wait for your current case to be completely resolved (settled or withdrawn) before filing a new one.'}
                      </p>
                      {ongoingCaseDetails && (
                        <div className="bg-white rounded-md p-3 border border-amber-200">
                          <p className="text-xs font-medium text-amber-800 mb-1">Current Case Details:</p>
                          <div className="text-xs text-amber-700 space-y-1">
                            <div><span className="font-medium">Case #{ongoingCaseDetails.id}:</span> {ongoingCaseDetails.case_title}</div>
                            <div><span className="font-medium">Status:</span> <span className="capitalize">{ongoingCaseDetails.status?.replace('_', ' ')}</span></div>
                            <div><span className="font-medium">Filed:</span> {new Date(ongoingCaseDetails.date_filed).toLocaleDateString()}</div>
                          </div>
                        </div>
                      )}
                      {!(user?.role === 'admin' || user?.role === 'secretary') && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => router.push('/user-dashboard/my-case')}
                            className="text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
                          >
                            View My Cases
                          </button>
                        </div>
                      )}
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
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#388e5c] focus:border-transparent ${
                          fieldErrors.natureOfCase ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        value={natureOfCase} 
                        onChange={e => { setNatureOfCase(e.target.value); setCaseTitle(""); setOtherCaseTitle(""); }}
                      >
                        <option value="">Select nature of case</option>
                        {natureCaseOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
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
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#388e5c] focus:border-transparent ${
                          fieldErrors.caseTitle ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        value={caseTitle} 
                        onChange={e => setCaseTitle(e.target.value)} 
                        disabled={!natureOfCase}
                      >
                        <option value="">Select a case title</option>
                        {natureOfCase && caseTitleOptions[natureOfCase]?.map((title) => (
                          <option key={title} value={title}>{title}</option>
                        ))}
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
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#388e5c] focus:border-transparent ${
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
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#388e5c] focus:border-transparent ${
                            fieldErrors.caseDescription ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                          }`}
                          value={caseDescription} 
                          onChange={e => setCaseDescription(e.target.value)} 
                          rows={4}
                          placeholder="Describe what happened, when it occurred, and any relevant details..."
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
                  onClick={() => router.push("/user-dashboard")}
                  className="px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || success || (hasOngoingCase && !(user?.role === 'admin' || user?.role === 'secretary'))}
                  className="flex items-center px-8 py-3 bg-[#388e5c] text-white rounded-md border border-[#2d6e47] hover:bg-[#4a9d68] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
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
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Case has been filed successfully.</div>
            <button 
              onClick={() => {
                setShowSuccessModal(false);
                router.push("/user-dashboard/my-case");
                resetForm();
              }} 
              className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
