import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import { useNavigate } from 'react-router-dom';

function Booking() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);

  const categories = ['All', 'Cardio', 'Flexibility', 'Strength Training', 'Yoga', 'Meditation'];

  useEffect(() => {
    fetchClasses();
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch('https://fitness-mmqs.onrender.com/api/classes/my-classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUserBookings(data);
    } catch (error) {
      console.error('Error fetching user bookings:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('https://fitness-mmqs.onrender.com/api/classes');
      const data = await response.json();
      
      // Sort classes by date to show most recent first
      const sortedClasses = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setClasses(sortedClasses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setLoading(false);
    }
  };

  const handleBookClass = async (classId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        alert('Please log in to book a class');
        navigate('/login');
        return;
      }

      const response = await fetch(`https://fitness-mmqs.onrender.com/api/classes/${classId}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Class booked successfully!');
        fetchClasses(); // Refresh the classes list
        fetchUserBookings(); // Refresh user's bookings
      } else {
        alert(data.message || 'Failed to book class');
      }
    } catch (error) {
      console.error('Error booking class:', error);
      alert('Failed to book class. Please try again.');
    }
  };

  const filteredClasses = classes.filter(classItem => {
    // Check if the class is in the future
    const classDate = new Date(classItem.date);
    const classTime = classItem.time.split(':');
    classDate.setHours(parseInt(classTime[0]), parseInt(classTime[1]));
    const now = new Date();
    
    // Filter out past classes
    if (classDate < now) {
      return false;
    }

    // Apply category filter
    if (selectedCategory === 'All') {
      return true;
    }
    return classItem.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Simplified formatTime function to ensure compact display
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // New function to convert 24-hour to 12-hour format
  const convert24to12Hour = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-#1F2937 text-white">
      {/* Header */}
      <header className="flex justify-center items-center px-6 py-4 relative">
        <button 
          onClick={() => navigate(-1)}
          className="absolute left-8 w-10 h-10 rounded-full  flex items-center justify-center hover:bg-gray-700 transition-colors ml-4 "
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <img 
          src={logo} 
          alt="FIT TIME" 
          className="h-16 w-auto" 
        />
      </header>

      {/* Categories */}
      <section className="px-6 mt-4">
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-300 ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Classes */}
      <section className="px-6 mt-8 mb-24">
        <h2 className="text-2xl font-bold mb-6">Available Classes</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-gray-400">No classes available for this category</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredClasses.map((classItem) => {
              const isBooked = userBookings.some(booking => booking._id === classItem._id);
              return (
                <div 
                  key={classItem._id}
                  className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1"
                >
                  {/* Category Badge */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                      {classItem.category}
                    </span>
                  </div>

                  {/* Instructor Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">{classItem.instructor?.name || 'Unknown Instructor'}</h3>
                    <p className="text-sm text-emerald-400">Instructor</p>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center bg-gray-700 rounded-lg p-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Date</p>
                        <p className="text-white font-semibold">{new Date(classItem.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center bg-gray-700 rounded-lg p-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Time</p>
                        <p className="text-white font-semibold">{convert24to12Hour(classItem.time)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center bg-gray-700 rounded-lg p-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="text-white font-semibold">{classItem.place}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Booking;
