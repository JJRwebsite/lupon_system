import React, { useState, useEffect } from 'react';
import { XMarkIcon, ScaleIcon } from "@heroicons/react/24/outline";

interface SetArbitrationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (date: string, time: string, members: string[]) => void;
  arbitrators: { id: string; name: string }[];
  selectedCase?: any;
  onReschedule?: (date: string, time: string, rescheduleReason?: string) => void;
  mode?: 'arbitration' | 'conciliation'; // Add mode prop
}

function SetArbitrationModalComplete({ 
  open, 
  onClose, 
  onSave, 
  arbitrators, 
  selectedCase, 
  onReschedule,
  mode = 'arbitration' 
}: SetArbitrationModalProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [members, setMembers] = useState(["", "", ""]);
  const [warning, setWarning] = useState("");
  const [processType, setProcessType] = useState("schedule");
  const [reschedReason, setReschedReason] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningModalMessage, setWarningModalMessage] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slotInfo, setSlotInfo] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  // Function to show warning modal
  const showWarning = (message: string) => {
    setWarningModalMessage(message);
    setShowWarningModal(true);
  };

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

  // Function to fetch slot availability for a selected date
  const fetchSlotAvailability = async (selectedDate: string) => {
    setLoadingSlots(true);
    try {
      // Use different API endpoints based on mode
      let url;
      if (mode === 'conciliation') {
        url = `http://localhost:5000/api/conciliation/available-slots/${selectedDate}`;
        if (processType === 'reschedule' && selectedCase?.id) {
          url += `?excludeConciliationId=${selectedCase.id}`;
        }
      } else {
        // Default to mediation endpoint for arbitration (cross-system validation)
        url = `http://localhost:5000/api/mediation/available-slots/${selectedDate}`;
        if (processType === 'reschedule' && selectedCase?.id) {
          url += `?excludeArbitrationId=${selectedCase.id}`;
        }
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Backend returns data in nested data property
        setSlotInfo({
          availableSlots: data.data.availableSlots,
          usedSlots: data.data.usedSlots,
          maxSlots: data.data.maxSlotsPerDay,
          scheduledTimes: data.data.scheduledTimes,
          isFull: data.data.isFull
        });
        setBookedTimes(data.data.bookedTimes || []);
      } else {
        console.error('Failed to fetch slot availability');
        setSlotInfo(null);
        setBookedTimes([]);
      }
    } catch (error) {
      console.error('Error fetching slot availability:', error);
      setSlotInfo(null);
      setBookedTimes([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (dateString: string) => {
    setDate(dateString);
    setTime(""); // Reset time when date changes
    fetchSlotAvailability(dateString);
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
    
    // Parse the time slot (format: "08:00", "13:00", etc.)
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    
    return slotTime <= now;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (processType === "schedule") {
      // Comprehensive validation for schedule conflicts
      if (!date || !time) {
        showWarning('Please select both date and time for scheduling.');
        return;
      }
      
      // Check if selected time is in the past
      if (isTimeSlotInPast(time, date)) {
        showWarning('Cannot schedule sessions in the past. Please select a future time.');
        return;
      }
      
      // Check if the selected time slot is already booked
      if (bookedTimes.includes(time)) {
        showWarning('This time slot is already booked. Please select a different time.');
        return;
      }
      
      // Check if maximum slots per day would be exceeded
      if (slotInfo?.isFull && !bookedTimes.includes(time)) {
        showWarning('No available slots for this date. Maximum 4 sessions per day allowed.');
        return;
      }
      
      // Additional validation: Check for minimum 1-hour interval
      const selectedTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1] || '0');
      const conflictingSlot = bookedTimes.find(bookedTime => {
        const bookedTimeMinutes = parseInt(bookedTime.split(':')[0]) * 60 + parseInt(bookedTime.split(':')[1] || '0');
        const timeDifference = Math.abs(selectedTimeMinutes - bookedTimeMinutes);
        return timeDifference < 60; // Less than 1 hour
      });
      
      if (conflictingSlot) {
        showWarning('Minimum 1-hour interval required between sessions. Please select a different time.');
        return;
      }
      
      setWarning(''); // Clear any previous warnings
      onSave(date, time, members.filter(m => m));
      onClose();
    } else if (processType === "reschedule") {
      // Comprehensive validation for reschedule conflicts
      if (!date || !time) {
        showWarning('Please select both date and time for rescheduling.');
        return;
      }
      
      // Check if selected time is in the past
      if (isTimeSlotInPast(time, date)) {
        showWarning('Cannot reschedule sessions to the past. Please select a future time.');
        return;
      }
      
      // Check if the selected time slot is already booked
      if (bookedTimes.includes(time)) {
        showWarning('This time slot is already booked. Please select a different time.');
        return;
      }
      
      // Check if maximum slots per day would be exceeded
      if (slotInfo?.isFull && !bookedTimes.includes(time)) {
        showWarning('No available slots for this date. Maximum 4 sessions per day allowed.');
        return;
      }
      
      // Additional validation: Check for minimum 1-hour interval
      const selectedTimeMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1] || '0');
      const conflictingSlot = bookedTimes.find(bookedTime => {
        const bookedTimeMinutes = parseInt(bookedTime.split(':')[0]) * 60 + parseInt(bookedTime.split(':')[1] || '0');
        const timeDifference = Math.abs(selectedTimeMinutes - bookedTimeMinutes);
        return timeDifference < 60; // Less than 1 hour
      });
      
      if (conflictingSlot) {
        showWarning('Minimum 1-hour interval required between sessions. Please select a different time.');
        return;
      }
      
      setWarning(''); // Clear any previous warnings
      if (onReschedule) {
        onReschedule(date, time, reschedReason);
      }
      onClose();
    }
  };

  useEffect(() => {
    if (!open) {
      setDate("");
      setTime("");
      setMembers(["", "", ""]);
      setWarning("");
      setProcessType("schedule");
      setReschedReason("");
      setShowWarningModal(false);
      setWarningModalMessage("");
      setSlotInfo(null);
      setBookedTimes([]);
    }
  }, [open]);

  return !open ? null : (
    <>
      {/* Warning Modal */}
      {showWarningModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowWarningModal(false)}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduling Conflict</h3>
            <p className="text-sm text-gray-500 mb-6">{warningModalMessage}</p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}
    
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-blue-200">
        <div className="flex justify-between items-center px-8 py-6 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <ScaleIcon className="h-8 w-8 text-blue-100" />
            <div>
              <h2 className="text-2xl font-bold capitalize">{processType === "schedule" ? "Set Arbitration" : "Reschedule Arbitration"}</h2>
              <p className="text-blue-100 text-sm">{processType === "schedule" ? "Schedule arbitration session with slot validation" : `Arbitration ID #${selectedCase?.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-blue-500/20 rounded-full transition-all duration-200 group">
            <XMarkIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <form className="p-8 space-y-6" onSubmit={handleSubmit}>


            <div>
              <label className="block font-semibold text-blue-700 mb-3">
                {processType === "schedule" ? "Schedule Date" : "New Schedule Date"}
              </label>
              
              {/* Calendar Navigation */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    ←
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    →
                  </button>
                </div>
                
                {/* Calendar Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => day.isAvailable ? handleDateSelect(day.dateString) : null}
                        disabled={!day.isAvailable}
                        className={`
                          p-2 text-sm rounded-md transition-all duration-150 min-h-[36px]
                          ${
                            day.isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-md'
                              : day.isAvailable
                              ? 'hover:bg-blue-100 text-gray-700 font-medium'
                              : day.isCurrentMonth
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-300 cursor-not-allowed'
                          }
                          ${day.isToday && !day.isSelected ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slot Information Display */}
            {date && (
              <div className="space-y-3">
                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Checking available slots...</span>
                  </div>
                ) : slotInfo ? (
                  <div className={`p-4 rounded-lg border ${
                    slotInfo.isFull ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        slotInfo.isFull ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className={`font-semibold ${
                        slotInfo.isFull ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {slotInfo.isFull ? 'No slots available' : `${slotInfo.availableSlots} slots available`}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({slotInfo.usedSlots}/{slotInfo.maxSlots} used)
                      </span>
                    </div>
                    {slotInfo.scheduledTimes && slotInfo.scheduledTimes.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Already scheduled times:</p>
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
              <label className="block font-semibold text-blue-700 mb-3">
                {processType === "schedule" ? "Schedule Time" : "New Schedule Time"}
              </label>
              
              {/* Professional Time Picker */}
              <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">Available Time Slots</h4>
                    <span className="text-xs text-gray-500">8:00 AM - 6:00 PM</span>
                  </div>
                  {!date && (
                    <p className="text-xs text-blue-600 mt-1">Please select a date first to view available time slots</p>
                  )}
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
                      const noDateSelected = !date || date.trim() === '';
                      
                      // Check if time slot is in the past for current day
                      const isPastTime = isTimeSlotInPast(slot.value, date);
                      
                      const isDisabled = noDateSelected || isBooked || isPastTime || (slotInfo?.isFull && !isSelected);
                      
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            // Prevent any action if no date is selected or time is in past
                            if (noDateSelected || isPastTime) {
                              return;
                            }
                            if (!isDisabled) {
                              setTime(slot.value);
                            }
                          }}
                          disabled={isDisabled}
                          className={`px-2 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
                            noDateSelected
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : isBooked
                              ? 'bg-red-100 text-red-500 border-red-300 cursor-not-allowed opacity-50'
                              : isPastTime
                              ? 'bg-orange-100 text-orange-500 border-orange-300 cursor-not-allowed opacity-50'
                              : isDisabled
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          title={
                            noDateSelected ? 'Please select a date first' :
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

            {processType === "reschedule" && (
              <div>
                <label className="block font-semibold text-blue-700 mb-2">Reason for Reschedule</label>
                <textarea 
                  className="w-full border rounded px-3 py-2 min-h-[60px]" 
                  value={reschedReason} 
                  onChange={e => setReschedReason(e.target.value)} 
                  placeholder="Enter reason..." 
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-blue-700 mb-2">Lupon Members</label>
              {[0,1,2].map(i => {
                // Exclude already selected members in other dropdowns
                const selectedOthers = members.filter((m, idx) => idx !== i);
                const availableMembers = arbitrators.filter(member => !selectedOthers.includes(member.name) || member.name === members[i]);
                return (
                  <select
                    key={i}
                    className="border rounded px-3 py-2 w-full mb-2"
                    value={members[i]}
                    onChange={e => setMembers(m => { const arr = [...m]; arr[i] = e.target.value; return arr; })}
                  >
                    <option value="">Select Lupon Member {i+1} (optional)</option>
                    {availableMembers.map(member => (
                      <option key={member.id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                );
              })}
            </div>

            {warning && (
              <div className="flex items-center gap-2 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded px-4 py-2 my-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium">{warning}</span>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                disabled={!date || !time || bookedTimes.includes(time) || slotInfo?.isFull}
                className={`px-4 py-2 rounded font-semibold transition-all duration-200 ${
                  !date || !time || bookedTimes.includes(time) || slotInfo?.isFull
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-700 text-white hover:bg-blue-800'
                }`}
              >
                {processType === "schedule" ? "Set Arbitration" : "Reschedule Arbitration"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}

export default SetArbitrationModalComplete;
