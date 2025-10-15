"use client";
import { useEffect, useState } from "react";
import { getCurrentUser as getCurrentUserAuth, makeAuthenticatedRequest } from "@/utils/auth";

interface User {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  gender: string;
  purok: string; // updated from address
  barangay: string;
  municipality: string; // updated from city
  contact: string;
}

interface PersonalInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
  purok: string;
  barangay: string;
  municipality: string;
  contact: string;
}

interface LoginCredentials {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Official barangays of Cordova, Cebu (same as registration)
  const BARANGAYS = [
    "Alegria",
    "Bangbang",
    "Buagsong",
    "Catarman",
    "Cogon",
    "Day-as",
    "Gabi",
    "Gilutongan",
    "Ibabao",
    "Poblacion",
    "San Miguel",
  ];
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    birthDate: "",
    gender: "",
    purok: "",
    barangay: "",
    municipality: "Cordova",
    contact: "",
  });
  const [loginCredentials, setLoginCredentials] = useState<LoginCredentials>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [personalInfoSuccess, setPersonalInfoSuccess] = useState("");
  const [personalInfoError, setPersonalInfoError] = useState("");
  const [credentialsSuccess, setCredentialsSuccess] = useState("");
  const [credentialsError, setCredentialsError] = useState("");
  const [submittingPersonal, setSubmittingPersonal] = useState(false);
  const [submittingCredentials, setSubmittingCredentials] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUserAuth();
        if (userData) {
          setUser(userData as unknown as User);
          // Format birth_date to YYYY-MM-DD for the date input
          let birthDate = (userData as any).birth_date || "";
          if (birthDate && birthDate.length > 10) {
            birthDate = birthDate.slice(0, 10);
          }
          let gender = ((userData as any).gender || "").trim();
          if (gender.toLowerCase() === "male") gender = "Male";
          else if (gender.toLowerCase() === "female") gender = "Female";
          else gender = "";
          // Normalize municipality to 'Cordova' only and barangay to known list
          const muniRaw = (userData as any).municipality || "";
          const muni = typeof muniRaw === "string" && muniRaw.trim().toLowerCase() === "cordova" ? "Cordova" : "Cordova";
          const brgyRaw = (userData as any).barangay || "";
          const brgyNormalized = BARANGAYS.includes(brgyRaw) ? brgyRaw : "";
          setPersonalInfo({
            firstName: (userData as any).first_name || "",
            middleName: (userData as any).middle_name || "",
            lastName: (userData as any).last_name || "",
            email: (userData as any).email || "",
            birthDate: birthDate,
            gender: gender,
            purok: (userData as any).purok || "",
            barangay: brgyNormalized,
            municipality: muni,
            contact: (userData as any).contact || "",
          });
        }
      } catch (e) {
        setPersonalInfoError("Failed to load user info");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
  };

  const handleCredentialsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginCredentials({ ...loginCredentials, [e.target.name]: e.target.value });
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPersonal(true);
    setPersonalInfoError("");
    setPersonalInfoSuccess("");
    
    try {
      // Enforce municipality as 'Cordova' only
      const enforcedMunicipality = "Cordova";
      const res = await makeAuthenticatedRequest("http://localhost:5000/api/update-user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: personalInfo.firstName,
          middleName: personalInfo.middleName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          birthDate: personalInfo.birthDate,
          gender: personalInfo.gender,
          purok: personalInfo.purok,
          barangay: personalInfo.barangay,
          municipality: enforcedMunicipality,
          contact: personalInfo.contact,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPersonalInfoSuccess("Personal information updated successfully");
        // Update the user state with new data
        if (data.user) {
          setUser(data.user);
        }
      } else {
        setPersonalInfoError(data.message || "Failed to update personal information");
      }
    } catch (e) {
      setPersonalInfoError("Failed to update personal information");
    } finally {
      setSubmittingPersonal(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCredentials(true);
    setCredentialsError("");
    setCredentialsSuccess("");

    if (loginCredentials.newPassword !== loginCredentials.confirmPassword) {
      setCredentialsError("New passwords do not match");
      setSubmittingCredentials(false);
      return;
    }

    if (loginCredentials.newPassword.length < 6) {
      setCredentialsError("New password must be at least 6 characters long");
      setSubmittingCredentials(false);
      return;
    }

    try {
      const res = await makeAuthenticatedRequest("http://localhost:5000/api/update-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: loginCredentials.currentPassword,
          newPassword: loginCredentials.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCredentialsSuccess("Password updated successfully");
        setLoginCredentials({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setCredentialsError(data.message || "Failed to update password");
      }
    } catch (e) {
      setCredentialsError("Failed to update password");
    } finally {
      setSubmittingCredentials(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#388e5c] mb-8">Account Settings</h1>
      
      {/* Merged Settings Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account Settings
        </h2>
        
        {personalInfoSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {personalInfoSuccess}
          </div>
        )}
        {personalInfoError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {personalInfoError}
          </div>
        )}

        <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
          {/* Names Row: Last, First, Middle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={personalInfo.lastName}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                name="firstName"
                value={personalInfo.firstName}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={personalInfo.middleName}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Contact Row: Email, Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={personalInfo.email}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="text"
                name="contact"
                value={personalInfo.contact}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 09XXXXXXXXX"
                required
              />
            </div>
          </div>

          {/* Birth/Gender Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date *</label>
              <input
                type="date"
                name="birthDate"
                value={personalInfo.birthDate}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                name="gender"
                value={personalInfo.gender}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Address Row: Purok, Barangay, Municipality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purok *</label>
              <input
                type="text"
                name="purok"
                value={personalInfo.purok}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
              <select
                name="barangay"
                value={personalInfo.barangay}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select Barangay</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Municipality *</label>
              <select
                name="municipality"
                value={personalInfo.municipality}
                onChange={handlePersonalInfoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Cordova">Cordova</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={submittingPersonal}
              className="flex-1 bg-[#388e5c] text-white py-2 px-4 rounded-md border border-[#2d7049] hover:bg-[#2d7049] focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingPersonal ? "Saving..." : "Save Personal Information"}
            </button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex-1 bg-[#388e5c] text-white py-2 px-4 rounded-md border border-[#2d7049] hover:bg-[#2d7049] focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">Update your login credentials</p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setLoginCredentials({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                  setCredentialsSuccess("");
                  setCredentialsError("");
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Update Password</h4>
              <p className="text-sm text-gray-500">Enter your current and new password</p>
            </div>
            
            {credentialsSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {credentialsSuccess}
              </div>
            )}
            {credentialsError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {credentialsError}
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={loginCredentials.currentPassword}
                  onChange={handleCredentialsChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter current password"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={loginCredentials.newPassword}
                  onChange={handleCredentialsChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={loginCredentials.confirmPassword}
                  onChange={handleCredentialsChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setLoginCredentials({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                    setCredentialsSuccess("");
                    setCredentialsError("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCredentials}
                  className="flex-1 px-6 py-3 bg-[#388e5c] text-white rounded-lg hover:bg-[#2d7049] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submittingCredentials ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}