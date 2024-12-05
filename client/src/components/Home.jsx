import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ConfirmationDialog from './ConfirmationDialog';
import NotificationBell from './NotificationBell';
import config from '../config';
import logo from '../assets/logo.png';
import lightmodelogo from '../assets/lightmodelogo.png';
import cardioImg from '../assets/Cardio.png';
import flexibilityImg from '../assets/Flexibility.png';
import strengthtrainingImg from '../assets/Strengthtraining.png';
import yogaImg from '../assets/Yoga.png';
import meditationImg from '../assets/Meditation.png';
import { FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import Header from './Header';

function Home() {
  const navigate = useNavigate();
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [classToCancel, setClassToCancel] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchUpcomingClasses();
    fetchUserBookings();
    fetchUserData();
  }, []);

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
        // Store all booked class IDs
        const bookedIds = data.bookings.map(booking => booking.classId);
        setUserBookings(bookedIds);
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const isClassBooked = (classId) => {
    return userBookings.includes(classId) || 
           (userData && upcomingClasses.find(c => c._id === classId)?.participants?.includes(userData._id));
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
      const response = await fetch(`${config.API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const bookingsData = await response.json();
      
      if (!bookingsData.success) {
        toast.error('Failed to find booking');
        return;
      }

      const activeBooking = bookingsData.bookings.find(b => 
        b.classId === classToCancel._id && 
        b.status === 'booked'
      );

      if (!activeBooking) {
        toast.error('No active booking found for this class');
        return;
      }

      // Cancel with booking ID
      const cancelResponse = await fetch(`${config.API_URL}/bookings/${activeBooking.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await cancelResponse.json();

      if (data.success) {
        // Remove the booking locally
        setUpcomingClasses(prevClasses => 
          prevClasses.map(classItem => 
            classItem._id === classToCancel._id 
              ? { ...classItem, participants: classItem.participants.filter(id => id !== userData._id) }
              : classItem
          )
        );
        // Also update userBookings
        setUserBookings(prevBookings => prevBookings.filter(id => id !== classToCancel._id));
        
        toast.success('Booking cancelled successfully!');
        // Refresh the classes
        fetchUpcomingClasses();
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

  const handleBookClass = async (classId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        toast.error('Please log in to book a class');
        navigate('/login');
        return;
      }

      const classToBook = upcomingClasses.find(c => c._id === classId);
      if (!classToBook) {
        toast.error('Class not found');
        return;
      }

      // Validate required fields
      if (!classToBook.category || !classToBook.date || !classToBook.time || !classToBook.place) {
        toast.error('Missing class information. Please try again.');
        return;
      }

      const response = await fetch(`${config.API_URL}/bookings/book-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: classToBook._id,
          className: classToBook.category,
          date: classToBook.date,
          time: classToBook.time,
          place: classToBook.place
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to book class');
      }

      if (data.success) {
        toast.success('Class booked successfully! Redirecting to calendar...');
        
        // Create a booking object that matches the database structure
        const newBooking = {
          _id: data.booking._id,
          classId: classToBook._id,
          className: classToBook.category,
          instructor: data.booking.instructor,
          date: classToBook.date,
          time: classToBook.time,
          place: classToBook.place,
          status: 'booked'
        };

        // Update local state
        setUserBookings(prevBookings => [...prevBookings, newBooking]);
        
        // Redirect to calendar after a short delay
        setTimeout(() => {
          navigate('/calendar');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to book class');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to book class. Please try again.');
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

  const handleConfirmBooking = async () => {
    if (selectedClass) {
      await handleBookClass(selectedClass._id);
    }
    setDialogOpen(false);
    setSelectedClass(null);
  };

  const getTimeUntilClass = (classDateTime) => {
    const now = new Date();
    const diffMs = classDateTime - now;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs > 0) {
      return `Starts in ${diffHrs}h ${diffMins}m`;
    } else {
      return `Starts in ${diffMins}m`;
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_URL}/classes`);
      const data = await response.json();

      // Filter out classes that are not within the next 5 hours
      const currentTime = new Date();
      const fiveHoursFromNow = new Date(currentTime.getTime() + (5 * 60 * 60 * 1000));

      const upcomingClasses = data.filter(classItem => {
        const [year, month, day] = classItem.date.split('-').map(num => parseInt(num));
        const [hours, minutes] = classItem.time.split(':').map(num => parseInt(num));
        const classDateTime = new Date(year, month - 1, day, hours, minutes);
        
        // Check if class is between now and 5 hours from now
        return classDateTime > currentTime && classDateTime <= fiveHoursFromNow;
      });

      // Sort by time
      const sortedClasses = upcomingClasses.sort((a, b) => {
        const [yearA, monthA, dayA] = a.date.split('-').map(num => parseInt(num));
        const [hoursA, minutesA] = a.time.split(':').map(num => parseInt(num));
        const [yearB, monthB, dayB] = b.date.split('-').map(num => parseInt(num));
        const [hoursB, minutesB] = b.time.split(':').map(num => parseInt(num));
        
        const timeA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
        const timeB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
        return timeA - timeB;
      });

      setUpcomingClasses(sortedClasses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching upcoming classes:', error);
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Categories data with images
  const categories = [
    { id: 1, name: 'Cardio', image: cardioImg },
    { id: 2, name: 'Flexibility', image: flexibilityImg },
    { id: 3, name: 'Strength Training', image: strengthtrainingImg },
    { id: 4, name: 'Yoga', image: yogaImg },
    { id: 5, name: 'Meditation', image: meditationImg },
  ];

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

  return (
    <div className="min-h-screen bg-[#202c34] text-white">
      <Header userData={userData} />

      {/* Categories Section */}
      <section className="mt-8 px-6">
        <h2 className="text-2xl font-bold mb-4">Categories</h2>
        <div className="flex space-x-4 overflow-x-auto scrollbar-none pb-4">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex-shrink-0 w-36 h-44 rounded-2xl overflow-hidden relative shadow-lg transform transition-transform hover:scale-105"
              onClick={() => navigate('/booking')}
            >
              <div className="absolute inset-0">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-base font-semibold text-white tracking-wide">
                  {category.name}
                </span>
              </div>
              <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Classes Section */}
      <section className="mt-8 px-6 ">
        <div className="flex justify-between items-center -mb-8 pb-10">
          <h2 className="text-2xl font-bold text-white">All Available Classes</h2>
          <span className="text-sm text-white">Next 5 hours</span>
        </div>
        
        {/* Scrollable Container */}
        <div className="h-[400px] overflow-y-auto pr-2 scrollbar-hide">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4">
                <p className="text-white">Loading classes...</p>
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-white">No classes in the next 5 hours</p>
              </div>
            ) : (
              upcomingClasses.map((classItem) => {
                const [year, month, day] = classItem.date.split('-').map(num => parseInt(num));
                const [hours, minutes] = classItem.time.split(':').map(num => parseInt(num));
                const classDateTime = new Date(year, month - 1, day, hours, minutes);

                return (
                  <div 
                    key={classItem._id}
                    className="bg-[#1a1f2a] rounded-2xl p-5 border border-gray-800 shadow-lg hover:bg-gray-800/70 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-lg text-white">
                            {classItem.category}
                          </h3>
                          <span className="text-emerald-400 text-sm font-medium">
                            {getTimeUntilClass(classDateTime)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-white text-sm flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {classItem.instructor?.name || 'Unknown Instructor'}
                          </p>
                          {classDateTime && (
                            <p className="text-white text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {classDateTime.toLocaleDateString()} at {formatTime(classItem.time)}
                            </p>
                          )}
                          <p className="text-white text-sm flex items-center">
                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                            {classItem.place}
                          </p>
                          {classItem.capacity && (
                            <p className="text-white text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              {classItem.capacity - (classItem.participants?.length || 0)} spots left
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {isClassBooked(classItem._id) ? (
                      <button 
                        onClick={() => handleCancelClick(classItem)}
                        className="w-full mt-4 px-8 py-3 rounded-full text-sm font-semibold transition-colors duration-300 shadow-lg bg-red-500 hover:bg-red-600 text-white"
                      >
                        Cancel Booking
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBookClick(classItem)}
                        className="w-full mt-4 px-8 py-3 rounded-full text-sm font-semibold transition-colors duration-300 shadow-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Book Now
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#202c34] px-6 py-4 border-t border-gray-800">
        <div className="flex justify-between items-center">
          <button className="text-emerald-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/bookings')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/calendar')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Confirmation Dialog for Cancellation */}
      {showCancelDialog && (
        <ConfirmationDialog
          isOpen={showCancelDialog}
          onClose={() => {
            setShowCancelDialog(false);
            setClassToCancel(null);
          }}
          onConfirm={handleConfirmCancel}
          title="Cancel Class Booking"
          message={`Are you sure you want to cancel your booking for ${classToCancel?.category} class on ${new Date(classToCancel?.date).toLocaleDateString()} at ${formatTime(classToCancel?.time)}?`}
        />
      )}

      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedClass(null);
        }}
        onConfirm={handleConfirmBooking}
        title="Confirm Booking"
        message={selectedClass ? `Are you sure you want to book ${selectedClass.category} class at ${formatTime(selectedClass.time)}?` : ''}
      />
    </div>
  );
}

export default Home;