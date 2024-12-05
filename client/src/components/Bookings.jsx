import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';
import yogaImg from '../assets/Yoga.png';
import flexibilityImg from '../assets/Flexibility.png';
import strengthtrainingImg from '../assets/Strengthtraining.png';
import cardioImg from '../assets/Cardio.png';
import config from '../config';
import ConfirmationDialog from './ConfirmationDialog';
import NotificationBell from './NotificationBell';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Header from './Header';

const Bookings = () => {
  const navigate = useNavigate();
  const [allClasses, setAllClasses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date()); // Use actual current date
  const [todayDate] = useState(new Date()); // Use actual current date
  const [liveTime, setLiveTime] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [userActiveBookings, setUserActiveBookings] = useState([]); 
  const [userData, setUserData] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [classToCancel, setClassToCancel] = useState(null);

  // Update live time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000); // Update every second for more accurate status changes

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAllClasses(); 
    fetchUserBookings();
    fetchUserData();
  }, [currentDate]); // Refetch when date changes

  const fetchAllClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/classes`);
      const data = await response.json();
      console.log('Fetched classes:', data); // Debug log
      
      // Filter out ended classes and sort remaining by time
      const currentTime = new Date();
      const upcomingClasses = data.filter(classItem => {
        // Debug logs
        console.log('Checking class:', classItem);
        console.log('Class date:', classItem.date);
        console.log('Class time:', classItem.time);
        
        const [year, month, day] = classItem.date.split('-').map(num => parseInt(num));
        const [hours, minutes] = classItem.time.split(':').map(num => parseInt(num));
        const classDateTime = new Date(year, month - 1, day, hours, minutes);
        
        // Debug logs
        console.log('Class datetime:', classDateTime);
        console.log('Current time:', currentTime);
        console.log('Is upcoming:', classDateTime > currentTime);
        
        return classDateTime > currentTime;
      });

      console.log('Upcoming classes:', upcomingClasses); // Debug log

      const sortedClasses = upcomingClasses.sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split('-').map(num => parseInt(num));
        const [hoursA, minutesA] = a.time.split(':').map(num => parseInt(num));
        const [yearB, monthB, dayB] = b.date.split('-').map(num => parseInt(num));
        const [hoursB, minutesB] = b.time.split(':').map(num => parseInt(num));
        
        const timeA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        const timeB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        return timeA - timeB;
      });
      
      setAllClasses(sortedClasses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching all classes:', error);
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${config.API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Only store active bookings (not cancelled)
        const activeBookings = data.bookings
          .filter(booking => booking.status === 'booked')
          .map(booking => booking.classId);
        
        console.log('Updated active user bookings:', activeBookings);
        setUserActiveBookings(activeBookings);
        setUserBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
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

  const isClassBooked = (classId) => {
    // Check if the class has an active (not cancelled) booking
    return userActiveBookings.includes(classId);
  };

  const handleBookClass = async (classId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error('Please log in to book a class');
        navigate('/login');
        return;
      }

      const classToBook = allClasses.find(c => c._id === classId);
      if (!classToBook) {
        toast.error('Class not found');
        return;
      }

      const requestData = {
        classId: classToBook._id,
        className: classToBook.category,
        date: classToBook.date,
        time: classToBook.time,
        place: classToBook.place
      };
      console.log('Booking request data:', requestData);

      const response = await fetch(`${config.API_URL}/bookings/book-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Class booked successfully!');
        // Update the local state immediately
        setUserActiveBookings(prev => [...prev, classId]);
        setUserBookings(prev => [...prev, data.booking]);
        // Refresh the classes to update the UI
        await fetchAllClasses();
        await fetchUserBookings();
      } else {
        if (data.message === 'You have already booked this class') {
          // If already booked, update the local state to reflect this
          setUserActiveBookings(prev => [...prev, classId]);
        }
        toast.error(data.message || 'Failed to book class');
      }
    } catch (error) {
      console.error('Error booking class:', error);
      toast.error('Error booking class. Please try again.');
    }
  };

  const handleCancelClick = (classItem) => {
    setClassToCancel(classItem);
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!classToCancel) return;

    try {
      const token = localStorage.getItem('userToken');
      
      // Find the active booking for this class
      const activeBooking = userBookings.find(b => 
        b.classId === classToCancel._id && 
        b.status === 'booked'
      );

      if (!activeBooking) {
        toast.error('No active booking found for this class');
        return;
      }

      // Cancel with booking ID
      console.log('Attempting to cancel booking with ID:', activeBooking.id);
      const response = await fetch(`${config.API_URL}/bookings/${activeBooking.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Cancel response:', data);

      if (data.success) {
        // Remove the cancelled class from activeBookings and userBookings
        setUserActiveBookings(prevBookings => prevBookings.filter(id => id !== classToCancel._id));
        setUserBookings(prevBookings => prevBookings.filter(booking => booking.id !== activeBooking.id));

        // Force a re-render of the class list
        setAllClasses(prevClasses => [...prevClasses]);

        toast.success('Booking cancelled successfully!');
        setShowCancelDialog(false);
        setClassToCancel(null);

        // Refresh all data
        await fetchAllClasses();
        await fetchUserBookings();
      } else {
        toast.error(data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking. Please try again.');
    } finally {
      setShowCancelDialog(false);
      setClassToCancel(null);
    }
  };

  const handleBookClick = (classItem) => {
    if (!localStorage.getItem('userToken')) {
      toast.error('Please log in to book a class');
      navigate('/login');
      return;
    }

    setSelectedClass(classItem);
    setDialogOpen(true);
  };

  const handleConfirmBooking = () => {
    if (selectedClass) {
      handleBookClass(selectedClass._id);
    }
    setDialogOpen(false);
    setSelectedClass(null);
  };

  // Function to check if a class is upcoming (after current time)
  const isUpcoming = (classDate, classTime) => {
    const now = new Date();
    const [year, month, day] = classDate.split('-').map(num => parseInt(num));
    const [hours, minutes] = classTime.split(':').map(num => parseInt(num));
    const classDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Adjust the current time to match the application date (Nov 26, 2024)
    now.setFullYear(2024);
    now.setMonth(10); // November (0-based)
    now.setDate(26);
    
    return classDateTime > now;
  };

  // Function to get class status text and style
  const getClassStatus = (classDate, classTime, classId) => {
    const now = new Date();
    const [year, month, day] = classDate.split('-').map(num => parseInt(num));
    const [hours, minutes] = classTime.split(':').map(num => parseInt(num));
    const classDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Adjust the current time to match the application date (Nov 26, 2024)
    now.setFullYear(2024);
    now.setMonth(10); // November (0-based)
    now.setDate(26);

    if (isClassBooked(classId)) {
      return {
        text: 'Already Booked',
        style: 'bg-gray-600 cursor-not-allowed text-gray-300',
        disabled: true
      };
    } else if (classDateTime > now) {
      return {
        text: 'Book Now',
        style: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        disabled: false
      };
    } else {
      return {
        text: 'Class Closed',
        style: 'bg-gray-600 cursor-not-allowed text-gray-300',
        disabled: true
      };
    }
  };

  const getClassesForSelectedDate = () => {
    const now = new Date();
    return allClasses.filter(classItem => {
      const [year, month, day] = classItem.date.split('-').map(num => parseInt(num));
      const [hours, minutes] = classItem.time.split(':').map(num => parseInt(num));
      const classDate = new Date(year, month - 1, day);
      const classDateTime = new Date(year, month - 1, day, hours, minutes);

      // Check if class is on the selected date
      const isSameDate = classDate.getDate() === currentDate.getDate() &&
                        classDate.getMonth() === currentDate.getMonth() &&
                        classDate.getFullYear() === currentDate.getFullYear();

      // Check if class is in the past (including today's completed classes)
      const isPastOrCompleted = classDateTime < now;

      return isSameDate && !isPastOrCompleted;
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to format time to 12-hour format
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const goToPreviousDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      // Don't allow going before today's date
      if (newDate < todayDate) {
        return prev;
      }
      return newDate;
    });
  };

  const goToNextDay = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  const isBeforeToday = (date) => {
    const today = new Date(todayDate);
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const renderBookButton = (classItem) => {
    const isBooked = isClassBooked(classItem._id);
    
    if (isBooked) {
      return (
        <button
          onClick={() => handleCancelClick(classItem)}
          className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors mt-4"
        >
          Cancel Booking
        </button>
      );
    }

    const [year, month, day] = classItem.date.split('-').map(num => parseInt(num));
    const [hours, minutes] = classItem.time.split(':').map(num => parseInt(num));
    const classDateTime = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    
    // Check if class is in the past
    if (classDateTime < now) {
      return (
        <button
          disabled
          className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed mt-4"
        >
          Class Ended
        </button>
      );
    }

    return (
      <button
        onClick={() => handleBookClick(classItem)}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-grey-600 transition-colors mt-4"
      >
        Book Now
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#202c34] text-white">
      <Header userData={userData} />

      {/* Date Navigation Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={goToPreviousDay}
          disabled={isBeforeToday(currentDate) || currentDate.toDateString() === todayDate.toDateString()}
          className={`text-white p-2 ${
            isBeforeToday(currentDate) || currentDate.toDateString() === todayDate.toDateString()
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:text-emerald-500 transition-colors'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <h1 className="text-lg text-white font-medium">
            {formatDate(currentDate)}
          </h1>
          <div className="text-sm text-gray-400">
            {liveTime.toLocaleTimeString('en-US', { 
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })}
          </div>
        </div>
        
        <button 
          onClick={goToNextDay}
          className="text-white p-2 hover:text-emerald-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* All Classes Section */}
      <section className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">All Available Classes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : getClassesForSelectedDate().length === 0 ? (
          <p>No classes available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-290px)]">
            {getClassesForSelectedDate().map((classItem) => {
              let classImage;
              switch (classItem.category.toLowerCase()) {
                case 'yoga':
                  classImage = yogaImg;
                  break;
                case 'flexibility':
                  classImage = flexibilityImg;
                  break;
                case 'strength training':
                  classImage = strengthtrainingImg;
                  break;
                case 'cardio':
                  classImage = cardioImg;
                  break;
                default:
                  classImage = yogaImg;
              }

              return (
                <div key={classItem._id} className="bg-[#1a1f2a] rounded-lg p-4 shadow-lg relative border border-gray-800">
                  {/* Category Label */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-sm bg-emerald-500 px-3 py-1.5 rounded-full font-semibold text-white">
                      {classItem.category}
                    </span>
                  </div>

                  {/* Image Container with specific gradient */}
                  <div className="relative mb-4 rounded-lg overflow-hidden" 
                       style={{
                         background: 'linear-gradient(to right, #485563, #274046)'
                       }}>
                    <img 
                      src={classImage} 
                      alt={classItem.category} 
                      className="w-full h-40 object-contain p-4 transform transition-transform hover:scale-105" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{classItem.className}</h3>
                      </div>
                    </div>
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(classItem.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2 text-white mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(classItem.time)}</span>
                      <span className="text-sm">
                        ({getClassStatus(classItem.date, classItem.time, classItem._id).text})
                      </span>
                    </div>
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 8 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {classItem.place}
                    </div>
                    <div className="flex items-center text-white">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {classItem.instructor?.name || 'Unknown'}
                    </div>
                    
                    {renderBookButton(classItem)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleConfirmBooking}
        title="Book Class"
        message={`Are you sure you want to book this ${selectedClass?.category} class?`}
      />

      <ConfirmationDialog
        isOpen={showCancelDialog}
        onClose={() => {
          setShowCancelDialog(false);
          setClassToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for this ${classToCancel?.category} class?`}
      />

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
            className="text-emerald-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="text-white"
          >
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

export default Bookings;