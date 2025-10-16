"use client";
import React, { useState, useEffect } from "react";
import { EyeIcon, TrashIcon, CalendarDaysIcon, XMarkIcon, UserIcon, UsersIcon, IdentificationIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowRightIcon, CreditCardIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import ResidentSelector from "../../components/ResidentSelector";


interface Resident {
  id: number;
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
  case_nature?: string;
  date_filed?: string;
  nature_of_case?: string;
  case_description?: string;
  relief_description?: string;

}

// Reusable centered warning modal for consistency
function WarningModal({ open, title, message, onClose }: { open: boolean; title: string; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-700 mb-6 leading-relaxed">{message}</p>
          <button
            onClick={onClose}
            className="w-full sm:w-72 px-6 py-3 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}

function SetMediationModal({ open, onClose, onSubmit, caseData }: { open: boolean, onClose: () => void, onSubmit: (data: any) => void, caseData: any }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [warning, setWarning] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictMessage, setConflictMessage] = useState("");

  // Generate calendar data for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
      // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues
      const localDateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const isSelected = date === localDateString;
      const isAvailable = isCurrentMonth && !isPast && !isWeekend;
      
      days.push({
        date: currentDate,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isWeekend,
        isSelected,
        isAvailable,
        dateString: localDateString
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Function to check if a time slot is in the past for the current day
  const isTimeSlotInPast = (timeSlot: string, selectedDate: string) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateObj = new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    // If the selected date is not today, time validation doesn't apply
    if (selectedDateObj.getTime() !== today.getTime()) {
      return false;
    }
    
    // Parse the time slot (format: "8:00 AM", "1:00 PM", etc.)
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    const slotTime = new Date();
    slotTime.setHours(hour24, minutes, 0, 0);
    
    return slotTime <= now;
  };

  // Function to fetch slot availability for a selected date
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      const response = await fetch(`http://localhost:5000/api/mediation/available-slots/${selectedDate}`);
      const result = await response.json();
      
      if (result.success) {
        setSlotInfo(result.data);
        setBookedTimes(result.data.bookedTimes || []);
      } else {
        console.error('Failed to fetch slot availability:', result.error);
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const selectDate = (dateString: string) => {
    setDate(dateString);
    setTime(""); // Reset selected time when date changes
    setWarning("");
    // Fetch slot availability for the selected date
    fetchSlotAvailability(dateString);
  };

  // Form submission handler with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!date || !time) {
      setConflictMessage("Please select both date and time.");
      setShowConflictModal(true);
      return;
    }
    
    // Check if selected time is in the past
    if (isTimeSlotInPast(time, date)) {
      setConflictMessage("Cannot schedule sessions in the past. Please select a future time.");
      setShowConflictModal(true);
      return;
    }
    
    // Check if selected time is booked
    if (bookedTimes.includes(time)) {
      setConflictMessage("This time slot is already booked. Please choose a different time.");
      setShowConflictModal(true);
      return;
    }
    
    // Check if slots are full
    if (slotInfo?.isFull) {
      setConflictMessage("All time slots for this date are full. Please select another date.");
      setShowConflictModal(true);
      return;
    }
    
    // Clear any warnings and submit
    setWarning("");
    onSubmit({ date, time });
  };

  useEffect(() => {
    if (!open) {
      setDate(""); setTime(""); setWarning("");
      setCurrentMonth(new Date());
      setSlotInfo(null);
      setBookedTimes([]);
      setLoadingSlots(false);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <WarningModal
        open={showConflictModal}
        title="Schedule Time Conflict"
        message={conflictMessage}
        onClose={() => setShowConflictModal(false)}
      />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-green-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="h-8 w-8 text-green-100" />
            <div>
              <h2 className="text-2xl font-bold">Set Mediation</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Date</label>
              
              {/* Custom Calendar */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button 
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  
                  <button 
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => day.isAvailable ? selectDate(day.dateString) : null}
                      disabled={!day.isAvailable}
                      className={`
                        h-10 w-full text-sm rounded-md transition-all duration-200 relative
                        ${
                          day.isSelected
                            ? 'bg-green-600 text-white font-semibold shadow-md'
                            : day.isAvailable
                            ? 'hover:bg-green-50 hover:text-green-700 text-gray-700'
                            : day.isCurrentMonth
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-200 cursor-not-allowed'
                        }
                        ${
                          day.isToday && !day.isSelected
                            ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                            : ''
                        }
                        ${
                          day.isWeekend && day.isCurrentMonth
                            ? 'bg-red-50 text-red-400'
                            : ''
                        }
                      `}
                    >
                      {day.day}
                      {day.isToday && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
                
              </div>
            </div>
            
            {/* Slot Availability Information */}
            {date && (
              <div className="mb-4">
                {loadingSlots ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700">Checking slot availability...</span>
                  </div>
                ) : slotInfo ? (
                  <div className={`p-3 border rounded-lg ${
                    slotInfo.isFull 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${
                        slotInfo.isFull ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        Slot Availability
                      </h4>
                      <span className={`text-sm font-medium ${
                        slotInfo.isFull ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {slotInfo.usedSlots}/{slotInfo.maxSlotsPerDay} slots used
                      </span>
                    </div>
                    
                    {slotInfo.isFull && (
                      <p className="text-sm text-red-600 mb-2">
                         No slots available for this date. Please choose a different date.
                      </p>
                    )}
                    
                    {slotInfo.scheduledTimes.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Already scheduled times:</p>
                        <div className="flex flex-wrap gap-1">
                          {slotInfo.scheduledTimes.map((scheduledTime: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              {scheduledTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
            
            <div>
              <label className="block font-semibold text-blue-700 mb-3">Schedule Time</label>
              
              {/* Compact Professional Time Picker */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Available Time Slots</h4>
                    <span className="text-xs text-gray-500">8:00 AM - 6:00 PM</span>
                  </div>
                </div>
                
                <div className="p-3">
                  {/* All Time Slots in Compact Grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: '08:00', display: '8:00 AM' },
                      { value: '09:00', display: '9:00 AM' },
                      { value: '10:00', display: '10:00 AM' },
                      { value: '11:00', display: '11:00 AM' },
                      { value: '13:00', display: '1:00 PM' },
                      { value: '14:00', display: '2:00 PM' },
                      { value: '15:00', display: '3:00 PM' },
                      { value: '16:00', display: '4:00 PM' },
                      { value: '17:00', display: '5:00 PM' },
                      { value: '18:00', display: '6:00 PM' }
                    ].map((slot) => {
                      const isSelected = time === slot.value;
                      const isBooked = bookedTimes.includes(slot.value);
                      const isPastTime = isTimeSlotInPast(slot.display, date);
                      const isDisabled = isBooked || isPastTime || (slotInfo?.isFull && !isSelected);
                      
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => !isDisabled ? setTime(slot.value) : null}
                          disabled={isDisabled}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                            isSelected
                              ? 'bg-green-600 text-white border-green-600 shadow-md'
                              : isBooked
                              ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed opacity-50'
                              : isPastTime
                              ? 'bg-orange-100 text-orange-500 border-orange-300 cursor-not-allowed opacity-50'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                          }`}
                          title={
                            isBooked ? 'This time slot is already booked' : 
                            isPastTime ? 'This time has already passed' :
                            isDisabled ? 'No slots available' : ''
                          }
                        >
                          {slot.display}
                          {isBooked && (
                            <span className="ml-1 text-xs">🚫</span>
                          )}
                          {isPastTime && (
                            <span className="ml-1 text-xs">⏰</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            {/* Inline warning removed; all messages shown via modal */}
            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                disabled={!date || !time || bookedTimes.includes(time) || slotInfo?.isFull}
                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                  !date || !time || bookedTimes.includes(time) || slotInfo?.isFull
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                Set Mediation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



function ViewCaseModal({ open, onClose, caseData }: { open: boolean, onClose: () => void, caseData: any }) {

  
  if (!open || !caseData) return null;
  

  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-50" aria-hidden="true" />
        <div className="relative bg-white rounded-2xl shadow-2xl w-[900px] p-0 z-10 border border-blue-200 my-16 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 z-20 flex justify-between items-center px-6 py-4 border-b border-blue-100 bg-blue-700 rounded-t-2xl">
            <span className="font-semibold text-lg text-white flex items-center gap-2"><DocumentTextIcon className="h-6 w-6 text-blue-200" /> Case Details</span>
            <button onClick={onClose} className="hover:bg-blue-100 rounded-full p-1 transition"><XMarkIcon className="h-6 w-6 text-white hover:text-blue-700" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 px-6 py-4">
          {/* 2x2 Grid Layout for Case Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Case Details - Top Left */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Case Information</div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Title:</span> <span className="text-gray-900">{caseData.case_title}</span></div>
                <div><span className="font-medium text-gray-700">Nature:</span> <span className="text-gray-900">{caseData.nature_of_case || caseData.case_nature || 'N/A'}</span></div>
                <div><span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{caseData.status}</span></div>
                <div><span className="font-medium text-gray-700">Date Filed:</span> <span className="text-gray-900">{formatDate(caseData.date_filed)}</span></div>
                <div><span className="font-medium text-gray-700">Time Filed:</span> <span className="text-gray-900">{formatTime(caseData.date_filed)}</span></div>
              </div>
            </div>
            
            {/* Complainant Info - Top Right */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold"><UserIcon className="h-5 w-5" /> Complainant Information</div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.complainant?.display_name || 'N/A'}</span></div>
                {caseData.complainant?.contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.complainant.contact}</span></div>}
                {caseData.complainant?.purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.complainant.purok}</span></div>}
                {caseData.complainant?.barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.complainant.barangay}</span></div>}
              </div>
            </div>
            
            {/* Respondent Info - Bottom Left */}
            <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold"><UsersIcon className="h-5 w-5" /> Respondent Information</div>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.respondent?.display_name || 'N/A'}</span></div>
                {caseData.respondent?.contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.respondent.contact}</span></div>}
                {caseData.respondent?.purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.respondent.purok}</span></div>}
                {caseData.respondent?.barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.respondent.barangay}</span></div>}
              </div>
            </div>
            
            {/* Witness Info - Bottom Right (if exists) */}
            {caseData.witness ? (
              <div className="bg-white rounded-lg p-4 shadow border border-blue-100">
                <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold"><IdentificationIcon className="h-5 w-5" /> Witness Information</div>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium text-gray-700">Name:</span> <span className="text-gray-900">{caseData.witness.display_name}</span></div>
                  {caseData.witness.contact && <div><span className="font-medium text-gray-700">Contact:</span> <span className="text-gray-900">{caseData.witness.contact}</span></div>}
                  {caseData.witness.purok && <div><span className="font-medium text-gray-700">Purok:</span> <span className="text-gray-900">{caseData.witness.purok}</span></div>}
                  {caseData.witness.barangay && <div><span className="font-medium text-gray-700">Barangay:</span> <span className="text-gray-900">{caseData.witness.barangay}</span></div>}
                </div>
              </div>
            ) : (
              // Empty placeholder when no witness
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <IdentificationIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No Witness Information</p>
                  <p className="text-xs">No witness was provided for this case</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Case Description and Relief - Full Width */}
          {(caseData.case_description || caseData.relief_description) && (
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-blue-700 font-semibold"><DocumentTextIcon className="h-5 w-5" /> Case Details</div>
              <div className="space-y-3 text-sm">
                {caseData.case_description && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1">Case Description:</span>
                    <p className="text-gray-900">{caseData.case_description}</p>
                  </div>
                )}
                {caseData.relief_description && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1">Relief Sought:</span>
                    <p className="text-gray-900">{caseData.relief_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          

            </div>
          </div>
        </div>
      </div>
      

    </>
  );
}

function WithdrawConfirmationModal({ open, onClose, onConfirm, caseData }: { open: boolean; onClose: () => void; onConfirm: () => void; caseData: any }) {
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

function ReferralConfirmationModal({ open, onClose, onConfirm, caseData }: { open: boolean; onClose: () => void; onConfirm: (referredTo: string, reason: string) => void; caseData: any }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowRightIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Refer Case to External Agency</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          {/* Case Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Case #{caseData.id}</h3>
            </div>
            <p className="text-blue-800 font-medium mb-1">{caseData.case_title}</p>
            <p className="text-blue-700 text-sm">
              <span className="font-medium">Complainant:</span> {caseData.complainant?.display_name || 'N/A'}
            </p>
            <p className="text-blue-700 text-sm">
              <span className="font-medium">Respondent:</span> {caseData.respondent?.display_name || 'N/A'}
            </p>
          </div>

          {/* Warning Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Important Notice</h4>
                <p className="text-amber-800 text-sm leading-relaxed">
                  This case will be permanently removed from the Lupon system and transferred to the specified external agency. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center space-x-2">
                  <CreditCardIcon className="h-4 w-4 text-blue-600" />
                  <span>Refer to (Agency/Department)</span>
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                type="text"
                value={referredTo}
                onChange={(e) => setReferredTo(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 placeholder-gray-400"
                placeholder="e.g., Barangay Hall, Police Station, Regional Trial Court, DILG Office"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                <span className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  <span>Reason for Referral</span>
                  <span className="text-red-500">*</span>
                </span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 placeholder-gray-400 resize-none"
                rows={4}
                placeholder="Please provide a detailed reason for referring this case (e.g., Criminal matters beyond Lupon jurisdiction, Requires specialized legal expertise, Complex property disputes, etc.)"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button 
              className="px-6 py-2.5 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl" 
              onClick={handleSubmit}
              disabled={submitting || !referredTo.trim() || !reason.trim()}
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span>Refer Case</span>
                </span>
              )}
            </button>
          </div>
        </div>
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

// Helper to format time as HH:MM AM/PM
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

export default function PendingCasesPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCase, setViewCase] = useState<any>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawCase, setWithdrawCase] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showWithdrawSuccess, setShowWithdrawSuccess] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCase, setReferralCase] = useState<any>(null);
  const [showReferralSuccess, setShowReferralSuccess] = useState(false);
  // Warning modal for schedule conflicts/errors (Set Mediation)
  const [showScheduleConflict, setShowScheduleConflict] = useState(false);
  const [scheduleConflictMessage, setScheduleConflictMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/complaints/pending_cases");
        if (!res.ok) throw new Error("Failed to fetch pending cases");
        const data = await res.json();
        console.log('🔍 DEBUG: Fetched pending cases:', data);
        setComplaints(data);
      } catch (e: any) {
        console.error('Error fetching pending cases:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);



  const handleSetMediation = (caseData: any) => {
    setSelectedCase(caseData);
    setShowScheduleModal(true);
  };

  const handleMediationSubmit = async (mediationData: any) => {
    if (!selectedCase) return;
    try {
      const res = await fetch("http://localhost:5000/api/mediation/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaint_id: selectedCase.id,
          date: mediationData.date,
          time: mediationData.time,
        })
      });
      
      if (res.ok) {
        setComplaints((prev: Complaint[]) => prev.filter((c: Complaint) => c.id !== selectedCase.id));
        setShowScheduleModal(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2500);
      } else {
        // Handle backend validation errors via warning modal (no browser alert)
        const errorData = await res.json();
        const errorMessage = errorData.error || errorData.message || "Failed to set mediation schedule.";
        setScheduleConflictMessage(errorMessage);
        setShowScheduleConflict(true);
      }
    } catch (err) {
      setScheduleConflictMessage("Error connecting to server. Please try again.");
      setShowScheduleConflict(true);
    }
  };

  const handleViewCase = (caseData: any) => {
    setViewCase(caseData);
    setShowViewModal(true);
  };

  const handleWithdraw = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${id}/withdraw`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to withdraw complaint");
      setShowWithdrawSuccess(true);
      setTimeout(() => setShowWithdrawSuccess(false), 2500);
      setComplaints((prev: Complaint[]) => prev.filter((c: Complaint) => c.id !== id));
    } catch (err) {
      alert("Error withdrawing complaint.");
    }
  };

  const handleWithdrawClick = (caseData: any) => {
    setWithdrawCase(caseData);
    setShowWithdrawModal(true);
  };

  const confirmWithdraw = () => {
    if (withdrawCase) {
      handleWithdraw(withdrawCase.id);
      setShowWithdrawModal(false);
    }
  };

  const handleReferralClick = (caseData: any) => {
    setReferralCase(caseData);
    setShowReferralModal(true);
  };

  const handleReferral = async (referredTo: string, reason: string) => {
    if (!referralCase) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/referrals/transfer/${referralCase.id}`, {
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
      setComplaints((prev: Complaint[]) => prev.filter((c: Complaint) => c.id !== referralCase.id));
      setShowReferralModal(false);
      
      // Redirect to referrals page with the new referral ID
      setTimeout(() => {
        router.push(`/admin-dashboard/referrals?highlight=${result.referralId}`);
      }, 2500);
    } catch (err) {
      alert("Error referring complaint.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" aria-hidden="true" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center border border-green-200">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mb-4" />
            <div className="text-green-700 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-700 mb-4 text-center">Mediation schedule has been set.</div>
            <button onClick={() => setShowSuccess(false)} className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700">Close</button>
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
      <SetMediationModal open={showScheduleModal} onClose={() => setShowScheduleModal(false)} caseData={selectedCase} onSubmit={handleMediationSubmit} />
      <WarningModal
        open={showScheduleConflict}
        title="Schedule Time Conflict"
        message={scheduleConflictMessage}
        onClose={() => setShowScheduleConflict(false)}
      />
      <ViewCaseModal open={showViewModal} onClose={() => setShowViewModal(false)} caseData={viewCase} />
      <WithdrawConfirmationModal 
        open={showWithdrawModal} 
        onClose={() => setShowWithdrawModal(false)} 
        onConfirm={confirmWithdraw}
        caseData={withdrawCase}
      />
      <ReferralConfirmationModal 
        open={showReferralModal} 
        onClose={() => setShowReferralModal(false)} 
        onConfirm={handleReferral}
        caseData={referralCase}
      />
      <div className="bg-blue-800 text-white py-4 px-8 text-center text-xl font-semibold rounded-b">
        Pending Case Management
      </div>
      <div className="w-11/12 mx-auto mt-6">
        <div className="bg-white rounded-xl shadow p-0">
          <div className="flex items-center justify-between bg-blue-400 rounded-t-xl px-6 py-3">
            <span className="text-white text-lg font-semibold">Cases for Approval lists</span>
            <div className="flex items-center gap-2">
              <span className="bg-white text-blue-700 px-3 py-1 rounded font-semibold">
                Total Cases: {complaints.length}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left font-semibold">Case No.</th>
                  <th className="px-4 py-2 text-left font-semibold">Case Title</th>
                  <th className="px-4 py-2 text-left font-semibold">Complainant</th>
                  <th className="px-4 py-2 text-left font-semibold">Respondent</th>
                  <th className="px-4 py-2 text-left font-semibold">Case Nature</th>

                  <th className="px-4 py-2 text-left font-semibold">Date Filed</th>
                  <th className="px-4 py-2 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c: Complaint, idx: number) => (
                  <tr key={c.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2">{c.id}</td>
                    <td className="px-4 py-2">{c.case_title}</td>
                    <td className="px-4 py-2">{c.complainant?.display_name || 'N/A'}</td>
                    <td className="px-4 py-2">{c.respondent?.display_name || 'N/A'}</td>
                    <td className="px-4 py-2">{c.nature_of_case || c.case_nature || ''}</td>
                    <td className="px-4 py-2">{formatDate(c.date_filed)}</td>
                    <td className="px-4 py-2">
                      <button className="text-blue-600 hover:text-blue-800 mr-2" title="View" onClick={() => handleViewCase(c)}><EyeIcon className="h-5 w-5 inline" /></button>
                      <button className="text-green-600 hover:text-green-800 mr-2" title="Set Mediation" onClick={() => handleSetMediation(c)}><CalendarDaysIcon className="h-5 w-5 inline" /></button>
                      <button className="text-orange-600 hover:text-orange-800" title="Refer to External Agency" onClick={() => handleReferralClick(c)}><ArrowRightIcon className="h-5 w-5 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 