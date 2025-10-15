"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlusIcon, ArrowLeftIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    lastName: "",
    firstName: "",
    middleName: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    gender: "",
    purok: "",
    barangay: "",
    municipality: "",
    contact: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Email verification state
  const [verificationMode, setVerificationMode] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(600); // 10 minutes in seconds
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const validateStep1 = () => {
    const requiredFields = ['lastName', 'firstName', 'birthDate', 'gender', 'purok', 'barangay', 'municipality'];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`Please fill in all required fields`);
        return false;
      }
    }
    setError("");
    return true;
  };

  const validatePassword = (password: string) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password)
    };
    return validations;
  };

  const isPasswordStrong = (password: string) => {
    const validations = validatePassword(password);
    return Object.values(validations).every(Boolean);
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (verificationMode) {
        // Verify OTP code
        if (!otpCode || otpCode.length < 6) {
          setError("Please enter the 6-digit verification code");
          setLoading(false);
          return;
        }
        const resp = await fetch("http://localhost:5000/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, code: otpCode })
        });
        const data = await resp.json();
        if (data.success) {
          setSuccess("Email verified! Redirecting to login...");
          setTimeout(() => router.push("/login"), 1000);
        } else {
          setError(data.message || "Verification failed");
        }
      } else {
        // Validate email
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError("Please enter a valid email address");
          setLoading(false);
          return;
        }
        // Validate password
        if (!isPasswordStrong(form.password)) {
          setError("Password does not meet strength requirements");
          setLoading(false);
          return;
        }
        // Validate password confirmation
        if (form.password !== form.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        const { confirmPassword, ...submitData } = form;
        const res = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
        const data = await res.json();
        if (data.success) {
          // Switch to verification mode instead of redirecting
          setVerificationMode(true);
          setSuccess("We sent a verification code to your email. Please enter it below.");
          setMaskedEmail(data.emailMasked || form.email);
          setResendCooldown(60);
          setExpiresIn(600);
        } else {
          setError(data.message || "Registration failed");
        }
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const passwordValidations = validatePassword(form.password);

  // Handle countdown timers for resend cooldown and code expiry
  useEffect(() => {
    if (!verificationMode) return;
    const interval = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      setExpiresIn(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [verificationMode]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const resp = await fetch("http://localhost:5000/api/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email })
      });
      const data = await resp.json();
      if (data.success) {
        setSuccess("A new verification code was sent to your email.");
        setResendCooldown(60);
        setExpiresIn(600);
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* step for the registration */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-8 px-4">
        <div className="flex items-center space-x-4 mb-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'} font-semibold`}>
            1
          </div>
          <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-white/20'} rounded-full`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-white/20 text-white/60'} font-semibold`}>
            2
          </div>
        </div>

        {/* Register Form */}
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
          <form onSubmit={currentStep === 1 ? (e) => { e.preventDefault(); handleNextStep(); } : handleSubmit} className="p-8 sm:p-12 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="bg-blue-100 p-3 rounded-full mb-2">
                <UserPlusIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-blue-700 tracking-tight">
                {currentStep === 1 ? 'Personal Information' : 'Login Credentials'}
              </h2>
              <p className="text-gray-500 text-sm">
                {currentStep === 1 ? 'Step 1 of 2: Tell us about yourself' : 'Step 2 of 2: Set up your account'}
              </p>
            </div>
            {error && <div className="text-red-500 text-sm mb-2 text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm mb-2 text-center">{success}</div>}
            
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="lastName" className="text-xs font-medium text-gray-700">Last Name *</label>
                  <input name="lastName" id="lastName" placeholder="Last Name" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.lastName} onChange={handleChange} onKeyDown={handleKeyDown} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="firstName" className="text-xs font-medium text-gray-700">First Name *</label>
                  <input name="firstName" id="firstName" placeholder="First Name" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.firstName} onChange={handleChange} onKeyDown={handleKeyDown} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="middleName" className="text-xs font-medium text-gray-700">Middle Name</label>
                  <input name="middleName" id="middleName" placeholder="Middle Name (Optional)" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.middleName} onChange={handleChange} onKeyDown={handleKeyDown} />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="birthDate" className="text-xs font-medium text-gray-700">Birth Date *</label>
                  <input name="birthDate" id="birthDate" type="date" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.birthDate} onChange={handleChange} onKeyDown={handleKeyDown} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="gender" className="text-xs font-medium text-gray-700">Gender *</label>
                  <select name="gender" id="gender" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="purok" className="text-xs font-medium text-gray-700">Purok *</label>
                  <input name="purok" id="purok" placeholder="Purok" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.purok} onChange={handleChange} onKeyDown={handleKeyDown} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="barangay" className="text-xs font-medium text-gray-700">Barangay *</label>
                  <select name="barangay" id="barangay" className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" value={form.barangay} onChange={handleChange} required>
                    <option value="">Select Barangay</option>
                    <option value="Alegria">Alegria</option>
                    <option value="Bangbang">Bangbang</option>
                    <option value="Buagsong">Buagsong</option>
                    <option value="Catarman">Catarman</option>
                    <option value="Cogon">Cogon</option>
                    <option value="Dapitan">Dapitan</option>
                    <option value="Day‑as">Day‑as</option>
                    <option value="Gabi">Gabi</option>
                    <option value="Gilutongan">Gilutongan</option>
                    <option value="Ibabao">Ibabao</option>
                    <option value="Pilipog">Pilipog</option>
                    <option value="Poblacion">Poblacion</option>
                    <option value="San Miguel">San Miguel</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="municipality" className="text-xs font-medium text-gray-700">Municipality *</label>
                  <input name="municipality" id="municipality" placeholder="Municipality" className={`border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none ${form.municipality && form.municipality.toLowerCase() !== 'cordova' ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`} value={form.municipality} onChange={handleChange} onKeyDown={handleKeyDown} required />
                  {form.municipality && form.municipality.toLowerCase() !== 'cordova' && (
                    <span className="text-red-500 text-xs mt-1">Only residents of Cordova municipality can register</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="contact" className="text-xs font-medium text-gray-700">Contact Number</label>
                  <input
                    name="contact"
                    id="contact"
                    type="tel"
                    placeholder="09xx xxx xxxx"
                    className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none"
                    value={form.contact}
                    onChange={handleChange}
                  />
                </div>

              </div>
            )}

            {currentStep === 2 && verificationMode && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                  We sent a 6-digit verification code to <span className="font-semibold">{maskedEmail}</span>. Enter the code below to verify your email.
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-700">Verification Code</label>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0,6))}
                    placeholder="Enter 6-digit code"
                    className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none tracking-widest text-center"
                  />
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-600">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className={`underline ${resendCooldown>0? 'text-gray-400 cursor-not-allowed':'text-blue-600 hover:text-blue-700'}`}
                    >
                      {resendCooldown>0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                    <span>Code expires in {Math.max(0, Math.floor(expiresIn/60))}:{String(expiresIn%60).padStart(2,'0')}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Login Credentials or Email Verification */}
            {currentStep === 2 && !verificationMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="email" className="text-xs font-medium text-gray-700">Email Address *</label>
                    <input 
                      name="email" 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email address" 
                      className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 transition outline-none" 
                      value={form.email} 
                      onChange={handleChange} 
                      onKeyDown={handleKeyDown}
                      required 
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-xs font-medium text-gray-700">Password *</label>
                    <div className="relative">
                      <input 
                        name="password" 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Create a strong password" 
                        className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 pr-10 transition outline-none w-full" 
                        value={form.password} 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown}
                        required 
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">Confirm Password *</label>
                    <div className="relative">
                      <input 
                        name="confirmPassword" 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm your password" 
                        className="border focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 pr-10 transition outline-none w-full" 
                        value={form.confirmPassword} 
                        onChange={handleChange} 
                        onKeyDown={handleKeyDown}
                        required 
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                    <div className="space-y-1">
                      <div className={`flex items-center text-xs ${passwordValidations.length ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordValidations.length ? <CheckIcon className="h-4 w-4 mr-1" /> : <XMarkIcon className="h-4 w-4 mr-1" />}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidations.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordValidations.uppercase ? <CheckIcon className="h-4 w-4 mr-1" /> : <XMarkIcon className="h-4 w-4 mr-1" />}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidations.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordValidations.lowercase ? <CheckIcon className="h-4 w-4 mr-1" /> : <XMarkIcon className="h-4 w-4 mr-1" />}
                        One lowercase letter
                      </div>
                      <div className={`flex items-center text-xs ${passwordValidations.number ? 'text-green-600' : 'text-red-500'}`}>
                        {passwordValidations.number ? <CheckIcon className="h-4 w-4 mr-1" /> : <XMarkIcon className="h-4 w-4 mr-1" />}
                        One number
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Password Match Indicator */}
                {form.confirmPassword && (
                  <div className={`text-xs ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {form.password === form.confirmPassword ? (
                      <div className="flex items-center">
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Passwords match
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <button
              type="submit"
              className="mt-6 bg-blue-600 hover:bg-blue-700 focus:bg-blue-800 text-white rounded-lg px-6 py-3 font-semibold shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60 disabled:cursor-not-allowed w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8v8z"></path></svg>
                  {currentStep === 1 ? 'Processing...' : (verificationMode ? 'Verifying...' : 'Registering...')}
                </span>
              ) : (
                currentStep === 1 ? 'Next Step' : (verificationMode ? 'Verify Email' : 'Create Account')
              )}
            </button>
            <p className="text-sm text-center mt-2 text-gray-600">
              Already have an account? <a href="/login" className="text-blue-600 hover:underline font-medium">Login</a>
            </p>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center text-white/80">
          <p className="text-sm">
            Lupon Tagapamayapa - Barangay Ibabao, Cordova
          </p>
        </div>
      </div>
    </div>
  );
} 