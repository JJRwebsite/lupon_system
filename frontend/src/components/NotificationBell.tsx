"use client";

import React, { useState, useEffect, useRef } from 'react';
import { BellIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { makeAuthenticatedRequest, isAuthenticated } from '../utils/auth';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  complaint_title?: string;
  referral_title?: string;
  complaint_id?: number;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications with fallback authentication
  const fetchNotifications = async () => {
    try {
      let response;
      
      // Try JWT authentication first
      if (isAuthenticated()) {
        response = await makeAuthenticatedRequest('http://localhost:5000/api/notifications');
      } else {
        // Fallback to cookie-based authentication
        response = await fetch('http://localhost:5000/api/notifications', {
          credentials: 'include'
        });
      }
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch unread count with fallback authentication
  const fetchUnreadCount = async () => {
    try {
      let response;
      
      // Try JWT authentication first
      if (isAuthenticated()) {
        response = await makeAuthenticatedRequest('http://localhost:5000/api/notifications/unread-count');
      } else {
        // Fallback to cookie-based authentication
        response = await fetch('http://localhost:5000/api/notifications/unread-count', {
          credentials: 'include'
        });
      }
      
      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read with fallback authentication
  const markAsRead = async (notificationId: number) => {
    try {
      let response;
      
      // Try JWT authentication first
      if (isAuthenticated()) {
        response = await makeAuthenticatedRequest(`http://localhost:5000/api/notifications/${notificationId}/read`, {
          method: 'PUT',
        });
      } else {
        // Fallback to cookie-based authentication
        response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log(`✅ Notification ${notificationId} marked as read`);
      } else {
        console.error('Failed to mark notification as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read with fallback authentication
  const markAllAsRead = async () => {
    try {
      setLoading(true);
      let response;
      
      // Try JWT authentication first
      if (isAuthenticated()) {
        response = await makeAuthenticatedRequest('http://localhost:5000/api/notifications/mark-all-read', {
          method: 'PUT',
        });
      } else {
        // Fallback to cookie-based authentication
        response = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        console.log('✅ All notifications marked as read');
      } else {
        console.error('Failed to mark all notifications as read:', response.status);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get notification icon color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'case_accepted':
        return 'text-green-600';
      case 'case_for_approval':
        return 'text-purple-600';
      case 'mediation_scheduled':
      case 'conciliation_scheduled':
      case 'arbitration_scheduled':
        return 'text-blue-600';
      case 'case_settled':
        return 'text-green-600';
      case 'case_transferred':
        return 'text-orange-600';
      case 'session_rescheduled':
        return 'text-yellow-600';
      case 'case_withdrawn':
        return 'text-red-600';

      default:
        return 'text-gray-600';
    }
  };

  // Handle PDF download for complaint form (KP Form 7)
  const handleViewComplaint = async (complaintId: number, caseTitle: string) => {
    try {
      console.log('📄 Downloading complaint PDF for case:', caseTitle);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('http://localhost:5000/api/pdf/generate-complaint', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for fallback auth
        body: JSON.stringify({ complaintId })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        // Clean case title for filename
        const cleanTitle = caseTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
        a.download = `KP-Form-7-${cleanTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('✅ Complaint PDF downloaded successfully');
      } else {
        console.error('Failed to download complaint PDF:', response.status);
        alert('Failed to download complaint PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading complaint PDF:', error);
      alert('Error downloading complaint PDF. Please try again.');
    }
  };

  // Handle PDF download for mediation summons form (KP Form 9) - copied from complaints page
  const handleViewMediationSummons = async (complaintId: number, caseTitle: string) => {
    try {
      console.log('🔍 DEBUG: handleViewMediationSummons function called');
      console.log('🔍 DEBUG: Parameters - complaintId:', complaintId, 'caseTitle:', caseTitle);
      console.log('📄 Downloading mediation summons PDF for case:', caseTitle);
      
      // Get auth token
      const token = localStorage.getItem('token');
      
      // Prepare request headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // KP Form 9 - Summons (copied from complaints page logic)
      // First, fetch mediation schedule data for this complaint
      try {
        const mediationResponse = await fetch('http://localhost:5000/api/mediation', {
          headers,
          credentials: 'include'
        });
        const mediations = await mediationResponse.json();
        const mediationSchedule = mediations.find((m: any) => m.complaint_id === complaintId);
        
        console.log('🔍 DEBUG: All mediations:', mediations);
        console.log('🔍 DEBUG: Found mediation schedule:', mediationSchedule);
        
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
          case_no: String(complaintId),
          case_title: caseTitle || '',
          complainant_name: mediationSchedule?.complainant || 'N/A',
          respondent_name: mediationSchedule?.respondent || 'N/A',
          respondent_purok: mediationSchedule?.respondent_purok || '',
          respondent_barangay: mediationSchedule?.respondent_barangay || '',
          case_nature: caseTitle || '',
          barangay: 'Ibabao',
          hearing_date: hearingDate,
          hearing_time: hearingTime,
          summons_date: currentDate
        };
        
        console.log('🔍 DEBUG: About to call generate-summons API with data:', summonsData);
        
        const response = await fetch('http://localhost:5000/api/pdf/generate-summons', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ summonsData })
        });
        
        console.log('🔍 DEBUG: API response status:', response.status);
        console.log('🔍 DEBUG: API response ok:', response.ok);
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          // Clean case title for filename
          const cleanTitle = caseTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
          a.download = `KP-Form-9-Summons-${complaintId || 'summons'}.pdf`;
          console.log('🔍 DEBUG: Downloading file with name:', a.download);
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log('✅ Mediation summons PDF downloaded successfully');
        } else {
          console.error('Failed to download mediation summons PDF:', response.status);
          const responseText = await response.text();
          console.error('🔍 DEBUG: Response text:', responseText);
          alert('Failed to download mediation summons PDF. Please try again.');
        }
      } catch (mediationError) {
        console.error('Error fetching mediation schedule:', mediationError);
        // Fallback to default values if mediation fetch fails (copied from complaints page)
        const currentDate = new Date().toISOString().split('T')[0];
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        
        // Try to get names from any available mediation data
        let complainantName = 'N/A';
        let respondentName = 'N/A';
        let respondentPurok = '';
        let respondentBarangay = '';
        
        // Check if we have any mediation data for this complaint
        try {
          const mediationResponse = await fetch('http://localhost:5000/api/mediation', {
            headers,
            credentials: 'include'
          });
          if (mediationResponse.ok) {
            const mediations = await mediationResponse.json();
            const anyMediationForCase = mediations.find((m: any) => m.complaint_id === complaintId);
            if (anyMediationForCase) {
              complainantName = anyMediationForCase.complainant || 'N/A';
              respondentName = anyMediationForCase.respondent || 'N/A';
              respondentPurok = anyMediationForCase.respondent_purok || '';
              respondentBarangay = anyMediationForCase.respondent_barangay || '';
            }
          }
        } catch (e) {
          console.log('Could not fetch mediation data for names in fallback');
        }
        
        const summonsData = {
          case_no: String(complaintId),
          case_title: caseTitle || '',
          complainant_name: complainantName,
          respondent_name: respondentName,
          respondent_purok: respondentPurok,
          respondent_barangay: respondentBarangay,
          case_nature: caseTitle || '',
          barangay: 'Ibabao',
          hearing_date: defaultDate.toISOString().split('T')[0],
          hearing_time: '09:00',
          summons_date: currentDate
        };
        
        console.log('🔍 DEBUG: Using fallback summons data:', summonsData);
        
        const response = await fetch('http://localhost:5000/api/pdf/generate-summons', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ summonsData })
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          const cleanTitle = caseTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
          a.download = `KP-Form-9-Summons-${complaintId || 'summons'}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          console.log('✅ Mediation summons PDF downloaded successfully (fallback)');
        } else {
          console.error('Failed to download mediation summons PDF (fallback):', response.status);
          alert('Failed to download mediation summons PDF. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error downloading mediation summons PDF:', error);
      alert('Error downloading mediation summons PDF. Please try again.');
    }
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown is opened and mark all as read
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
      // Automatically mark all notifications as read when bell is clicked
      if (unreadCount > 0) {
        markAllAsRead();
      }
    }
  }, [showDropdown, unreadCount]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loading ? 'Marking...' : 'Mark all read'}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.is_read ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <p className={`text-sm mt-1 ${
                        !notification.is_read ? 'text-gray-800' : 'text-gray-600'
                      }`}>
                        {notification.message}
                      </p>
                      {(notification.complaint_title || notification.referral_title) && (
                        <p className="text-xs text-gray-500 mt-1">
                          Case: {notification.complaint_title || notification.referral_title}
                        </p>
                      )}
                      
                      {/* View Form Button for mediation/conciliation/arbitration notifications */}
                      {(notification.type === 'mediation_scheduled' || 
                        notification.type === 'conciliation_scheduled' || 
                        notification.type === 'arbitration_scheduled') && 
                       notification.complaint_id && notification.complaint_title && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔍 DEBUG: Notification button clicked');
                              console.log('🔍 DEBUG: Notification type:', notification.type);
                              console.log('🔍 DEBUG: Complaint ID:', notification.complaint_id);
                              console.log('🔍 DEBUG: Case title:', notification.complaint_title);
                              
                              // Use KP Form 9 (summons) for mediation, KP Form 7 (complaint) for others
                              if (notification.type === 'mediation_scheduled') {
                                console.log('🔍 DEBUG: Calling handleViewMediationSummons (KP Form 9)');
                                handleViewMediationSummons(notification.complaint_id!, notification.complaint_title!);
                              } else {
                                console.log('🔍 DEBUG: Calling handleViewComplaint (KP Form 7)');
                                handleViewComplaint(notification.complaint_id!, notification.complaint_title!);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          >
                            <DocumentArrowDownIcon className="h-3 w-3" />
                            {notification.type === 'mediation_scheduled' ? 'View Summons' : 'View Complaint'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Showing recent notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
