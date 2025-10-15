"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, setToken } from "../../utils/auth";
import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Use the JWT login utility
      const result = await login(email, password);
      
      if (result.success && result.user) {
        // Redirect based on user role
        const role = result.user.role;
        if (role === "admin" || role === "secretary") {
          router.push("/admin-dashboard");
        } else if (role === "user") {
          router.push("/user-dashboard");
        } else {
          setError("Invalid user role");
        }
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Network error occurred");
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

      {/* Back to Landing Page Button - Responsive */}
      <div className="fixed top-4 sm:top-6 left-4 sm:left-6 z-50">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            console.log('Back button clicked');
            router.push('/');
          }}
          className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg hover:bg-white/30 active:bg-white/40 transition-all duration-200 border border-white/20 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium hidden xs:inline">Back to Home</span>
          <span className="text-xs sm:text-sm font-medium xs:hidden">Back</span>
        </button>
      </div>

      {/* login form */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md border border-white/20">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <LockClosedIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-gray-600">Sign in to access the Lupon System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 outline-none text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 sm:py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors duration-200">
                Create Account
              </a>
            </p>
          </div>
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