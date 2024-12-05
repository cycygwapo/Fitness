import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import Header from "./Header";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import './Calendar.css';
import config from '../config';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CalendarComponent = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [userData, setUserData] = useState(null);
  const { theme } = useTheme();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get(`${config.API_URL}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        console.log('Raw bookings data:', response.data.bookings);
        
        // Filter out past bookings and sort by date
        const now = new Date();
        const upcomingBookings = response.data.bookings
          .map(booking => ({
            ...booking,
            _id: booking._id || booking.id // Ensure we have _id
          }))
          .filter(booking => {
            const bookingDate = new Date(booking.date);
            bookingDate.setHours(...booking.time.split(':'));
            return bookingDate > now;
          })
          .sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            dateA.setHours(...a.time.split(':'));
            dateB.setHours(...b.time.split(':'));
            return dateA - dateB;
          });

        console.log('Processed upcomingBookings:', upcomingBookings);
        setUserBookings(upcomingBookings);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      console.log('Attempting to cancel booking:', bookingId);
      
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error('Please log in to cancel a booking');
        navigate('/login');
        return;
      }

      const response = await axios.put(`${config.API_URL}/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        setUserBookings(prevBookings => 
          prevBookings.filter(booking => (booking._id || booking.id) !== bookingId)
        );
        window.dispatchEvent(new Event('bookingUpdated'));
      } else {
        toast.error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    const bookingId = bookingToCancel._id || bookingToCancel.id;
    await handleCancelBooking(bookingId);
    setShowCancelDialog(false);
    setBookingToCancel(null);
  };

  const hasBookingsOnDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return userBookings.some(booking => booking.date === dateStr);
  };

  const getBookingsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return userBookings.filter(booking => booking.date === dateStr);
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const hasBooking = hasBookingsOnDate(date);
      return `text-white rounded-full hover:bg-gray-800 transition-colors ${
        hasBooking ? 'bg-emerald-500 hover:bg-emerald-600 font-bold' : ''
      }`;
    }
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const bookings = getBookingsForDate(date);
      if (bookings.length > 0) {
        return (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <div className="flex space-x-1">
              {bookings.map((_, index) => (
                <div
                  key={index}
                  className={`w-1 h-1 rounded-full ${getDotColor(index)}`}
                />
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const handleDateClick = (date) => {
    const bookings = getBookingsForDate(date);
    if (bookings.length > 0) {
      setSelectedDateBookings(bookings);
      setShowModal(true);
    }
  };

  const getDaysInMonth = (date) => {
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    let days = [];
    
    // Add previous month's days
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate() - firstDay + i + 1;
      days.push({ day: prevMonthDay, disabled: true, isPrevMonth: true });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), i);
      const bookingsForDay = userBookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate.getDate() === i &&
               bookingDate.getMonth() === date.getMonth() &&
               bookingDate.getFullYear() === date.getFullYear();
      });

      days.push({ 
        day: i, 
        disabled: false, 
        isCurrentMonth: true,
        hasBookings: bookingsForDay.length > 0,
        bookings: bookingsForDay
      });
    }

    // Add next month's days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, disabled: true, isNextMonth: true });
    }
    
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getDateColor = (day) => {
    const colors = [
      'bg-emerald-100 hover:bg-emerald-200',
      'bg-blue-100 hover:bg-blue-200',
      'bg-purple-100 hover:bg-purple-200',
      'bg-red-100 hover:bg-red-200',
      'bg-amber-100 hover:bg-amber-200',
      'bg-teal-100 hover:bg-teal-200',
      'bg-pink-100 hover:bg-pink-200'
    ];
    // Use the day number to cycle through colors
    return colors[day % colors.length];
  };

  const getDotColor = (day) => {
    const colors = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-amber-500',
      'bg-teal-500',
      'bg-pink-500'
    ];
    // Use the day number to cycle through colors
    return colors[day % colors.length];
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserBookings();
    fetchUserData();

    const handleBookingUpdate = () => {
      console.log('Booking update event received');
      fetchUserBookings();
    };

    window.addEventListener('bookingUpdated', handleBookingUpdate);

    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdate);
    };
  }, []);

  return (
    <div className={`h-screen ${theme === 'light' ? 'bg-[#E5E1DA]' : 'bg-[#202c34]'} ${theme === 'light' ? 'text-black' : 'text-white'}`}>
      <Header userData={userData} />
      <div className="h-[calc(100vh-120px)] overflow-hidden px-4">
        <h2 className="text-2xl font-bold mb-2 flex items-center mt-2">
          <span className={theme === 'light' ? 'text-black' : 'text-white'}>Monthly</span>
          <span className="text-emerald-500 ml-2">Activity</span>
        </h2>

        <div className="h-full flex flex-col">
          {/* Calendar Container - Reduced height */}
          <div className="mb-4">
            <Calendar
              className={`custom-calendar ${theme === 'light' ? 'bg-[#89A8B2]' : 'bg-[#1a1f2a]'} rounded-lg shadow-lg p-2 border border-gray-800`}
              tileClassName={tileClassName}
              tileContent={tileContent}
              onChange={handleDateClick}
              value={currentDate}
              onClickDay={handleDateClick}
            />
          </div>

          {/* Upcoming Bookings Container - Takes remaining space */}
          <div className={`flex-1 overflow-auto ${theme === 'light' ? 'bg-[#89A8B2]' : 'bg-[#1a1f2a]'} rounded-lg shadow-lg p-4 border border-gray-800`}>
            <h2 className="text-xl font-bold mb-4 text-center">
              Your Upcoming Classes
            </h2>
            
            {userBookings.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 mb-4">No upcoming classes booked yet</p>
                <button 
                  onClick={() => navigate('/bookings')}
                  className="inline-block px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Book a Class
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100%-3rem)]">
                {userBookings.map((booking, index) => {
                  const bookingDate = new Date(booking.date);
                  bookingDate.setHours(...booking.time.split(':'));
                  
                  return (
                    <div
                      key={booking._id}
                      className={`${
                        theme === 'light' ? 'bg-white' : 'bg-[#202c34]'
                      } rounded-lg p-3 shadow-md border ${
                        theme === 'light' ? 'border-gray-200' : 'border-gray-700'
                      } transform transition-all duration-200 hover:scale-[1.02]`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getDotColor(index)} text-white`}>
                          {formatTime(booking.time)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {bookingDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <h3 className="text-base font-semibold text-emerald-500 mb-2">
                        {booking.className}
                      </h3>
                      
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center space-x-1" key={`instructor-row-${booking._id}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Instructor: {booking.instructor}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1" key={`place-row-${booking._id}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{booking.place}</span>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            console.log('Booking data:', booking);
                            if (!booking._id && !booking.id) {
                              console.error('Invalid booking data:', booking);
                              toast.error('Invalid booking ID');
                              return;
                            }
                            setBookingToCancel(booking);
                            setShowCancelDialog(true);
                          }}
                          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors duration-200 ease-in-out"
                        >
                          Cancel Class
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bookings Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'light' ? 'bg-[#E5E1DA]' : 'bg-[#1a1f2a]'} rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  Your Bookings for {new Date(selectedDateBookings[0]?.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedDateBookings.map((booking, index) => (
                  <div 
                    key={booking._id}
                    className={`${theme === 'light' ? 'bg-white' : 'bg-[#202c34]'} rounded-lg p-4 shadow-md border ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'} transform transition-all duration-200 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-emerald-500">
                        {booking.className}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-sm ${getDotColor(index)} text-white`}>
                        {formatTime(booking.time)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div key={`modal-instructor-${booking._id}`} className="flex items-center">
                        <span className="font-medium mr-2">Instructor:</span>
                        {booking.instructor}
                      </div>
                      <div key={`modal-place-${booking._id}`} className="flex items-center">
                        <span className="font-medium mr-2">Location:</span>
                        {booking.place}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${theme === 'light' ? 'bg-white' : 'bg-gray-800'} rounded-lg p-6 max-w-sm w-full shadow-xl`}>
            <h3 className="text-lg font-semibold mb-4">Cancel Class Booking</h3>
            <p className="mb-6">Are you sure you want to cancel your booking for this class?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setBookingToCancel(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Yes, Cancel Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#202c34] px-6 py-4 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate('/home')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/bookings')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
          </button>
          <button className="text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default CalendarComponent;