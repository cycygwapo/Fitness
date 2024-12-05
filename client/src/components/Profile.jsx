import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlus, FaShareAlt, FaFacebook, FaInstagram, FaTwitter, FaImage, FaMapMarkerAlt, FaTimes, FaCog, FaUserMinus, FaInfoCircle, FaShieldAlt, FaFileAlt, FaSignOutAlt } from 'react-icons/fa';
import lightModeLogo from '../assets/lightmodelogo.png';
import darkModeLogo from '../assets/logo.png';
import strengthtrainingImg from '../assets/Strengthtraining.png';
import flexibilityImg from '../assets/Flexibility.png';
import yogaImg from '../assets/Yoga.png';
import config from '../config';
import ProfileNavbar from './ProfileNavbar';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Profile = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [userData, setUserData] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [classData, setClassData] = useState({
    category: '',
    date: '',
    time: '',
    place: ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [map, setMap] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [mapPosition, setMapPosition] = useState([0, 0]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [instructorClasses, setInstructorClasses] = useState([]);
  const [showClassesModal, setShowClassesModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showDeleteClassDialog, setShowDeleteClassDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);

  const MapComponent = () => {
    const map = useMap();
    
    useEffect(() => {
      if (!map) return;
      
      // Create a search control
      const searchControl = L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: 'Search location...',
        geocoder: L.Control.Geocoder.nominatim()
      }).addTo(map);

      // Handle location selection
      searchControl.on('markgeocode', (e) => {
        const { center, name } = e.geocode;
        map.setView(center, 17);
        setSelectedPlace(name);
        setClassData({ ...classData, place: name });
        setShowMapDialog(false);
      });

      // Handle map click
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          if (data.display_name) {
            setSelectedPlace(data.display_name);
            setClassData({ ...classData, place: data.display_name });
            setShowMapDialog(false);
          }
        } catch (error) {
          console.error('Error getting location:', error);
        }
      });
    }, [map]);

    return null;
  };

  useEffect(() => {
    fetchUserData();
    fetchRecentBookings();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data.user);
        setIsInstructor(data.user.role === 'instructor');
        // Update local storage with fresh data
        localStorage.setItem('userData', JSON.stringify(data.user));
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.message === 'Failed to fetch user data') {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setIsInstructor(parsedData.role === 'instructor');
        } else {
          navigate('/login');
        }
      }
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/bookings/my-bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Sort bookings by date and time
        const sortedBookings = data.bookings.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateB - dateA; // Most recent first
        });
        setRecentBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Error fetching recent bookings:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/logo-animation');
    setShowLogoutDialog(false);
  };

  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem('userToken');
      console.log('Attempting upgrade with token:', token);
      
      if (!token) {
        toast.error('You must be logged in to upgrade to instructor');
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_URL}/users/upgrade-to-instructor`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        // Update local storage with new user data
        const updatedUserData = {
          ...userData,
          role: 'instructor'
        };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        setUserData(updatedUserData);
        setIsInstructor(true);
        setShowUpgradeDialog(false);
        toast.success('Successfully upgraded to instructor!');
      } else {
        throw new Error(data.message || 'Failed to upgrade to instructor');
      }
    } catch (error) {
      console.error('Error upgrading to instructor:', error);
      toast.error(error.message || 'Failed to upgrade to instructor. Please try again.');
      setShowUpgradeDialog(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      if (!classData.category || !classData.date || !classData.time || !classData.place) {
        toast.error('Please fill in all fields');
        return;
      }

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/classes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Class created successfully!');
        setClassData({ category: '', date: '', time: '', place: '' });
        setShowCreateClassDialog(false);
      } else {
        throw new Error(data.message || 'Failed to create class');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      toast.error(error.message || 'Failed to create class. Please try again.');
    }
  };

  const handleUpdateClass = async () => {
    try {
      if (!classData.category || !classData.date || !classData.time || !classData.place) {
        toast.error('Please fill in all fields');
        return;
      }

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/classes/${editingClass._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(classData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Class updated successfully!');
        setClassData({ category: '', date: '', time: '', place: '' });
        setShowCreateClassDialog(false);
        setEditingClass(null);
        fetchInstructorClasses(); // Refresh the classes list
      } else {
        throw new Error(data.message || 'Failed to update class');
      }
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error.message || 'Failed to update class. Please try again.');
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleShare = (booking, platform) => {
    setShowShareMenu(false);
    setSelectedBooking(null);

    const shareText = `Just booked a ${booking.className} class at ${booking.place} on ${new Date(booking.date).toLocaleDateString()} at ${formatTime(booking.time)}! 💪 #FitTime #Fitness`;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}&quote=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'instagram':
        // Since Instagram doesn't have a direct share URL, we'll copy the text to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
          toast.success('Text copied! Open Instagram to share.');
        });
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'save':
        // Here you would implement the logic to save as image
        // For now, we'll show a toast message
        toast.info('Save to photos feature coming soon!');
        break;
      default:
        break;
    }
  };

  const handleModeChange = (mode) => {
    toggleTheme(mode);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm account deletion');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Account successfully deleted');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        navigate('/');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleAboutClick = () => {
    setShowAboutDialog(true);
  };

  const handlePrivacyClick = () => {
    setShowPrivacyModal(true);
  };

  const handleTermsClick = () => {
    setShowTermsDialog(true);
  };

  const handleCloseMapDialog = () => {
    setShowMapDialog(false);
    setMap(null);
    setSearchBox(null);
    setSelectedPlace(null);
  };

  useEffect(() => {
    if (!showMapDialog) {
      setMap(null);
      setSearchBox(null);
      setSelectedPlace(null);
    }
  }, [showMapDialog]);

  // Fetch instructor's classes
  const fetchInstructorClasses = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/classes/instructor-classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        // Filter out past classes
        const now = new Date();
        const upcomingClasses = data.classes.filter(classItem => {
          const classDate = new Date(classItem.date);
          const [hours, minutes] = classItem.time.split(':');
          classDate.setHours(parseInt(hours), parseInt(minutes));
          return classDate > now;
        });
        
        // Sort by date and time
        const sortedClasses = upcomingClasses.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          const [hoursA, minutesA] = a.time.split(':');
          const [hoursB, minutesB] = b.time.split(':');
          dateA.setHours(parseInt(hoursA), parseInt(minutesA));
          dateB.setHours(parseInt(hoursB), parseInt(minutesB));
          return dateA - dateB;
        });

        setInstructorClasses(sortedClasses);
      } else {
        toast.error(data.message || 'Failed to fetch classes');
      }
    } catch (error) {
      console.error('Error fetching instructor classes:', error);
      toast.error('Failed to fetch your classes');
    }
  };

  // Handle edit class
  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setClassData({
      category: classData.category,
      date: classData.date.split('T')[0],
      time: classData.time,
      place: classData.place
    });
    setShowCreateClassDialog(true);
  };

  // Handle delete class
  const handleDeleteClass = async (classId) => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Class deleted successfully');
        fetchInstructorClasses(); // Refresh the classes list
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete class');
      }
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error(error.message || 'Failed to delete class');
    }
  };

  const handleDeleteClassClick = (classId) => {
    setClassToDelete(classId);
    setShowDeleteClassDialog(true);
  };

  const handleConfirmDeleteClass = async () => {
    if (classToDelete) {
      await handleDeleteClass(classToDelete);
      setShowDeleteClassDialog(false);
      setClassToDelete(null);
    }
  };

  const handleCancelDeleteClass = () => {
    setShowDeleteClassDialog(false);
    setClassToDelete(null);
  };

  useEffect(() => {
    if (userData?.role === 'instructor') {
      fetchInstructorClasses();
    }
  }, [userData]);

  const handleContactClick = () => {
    setShowContactDialog(true);
    setShowSidebar(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    // Here you would typically send this to your backend
    // For now, we'll just show a success message
    toast.success('Thank you for your message! We will get back to you soon.');
    setShowContactDialog(false);
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#202c34] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const categories = [
    'Cardio',
    'Flexibility',
    'Strength Training',
    'Yoga',
    'Meditation'
  ];

  // Function to handle saving changes
  const handleSaveChanges = () => {
    if (userData.newPassword !== userData.confirmPassword) {
      alert('New password and confirm password do not match.');
      return;
    }

    // Add logic to verify previous password and update user data
    // Example: Call an API to update the user profile
    console.log('Profile updated successfully');
  };

  return (
    <div 
      className="min-h-screen transition-colors duration-200" 
      style={{ 
        backgroundColor: theme === 'light' ? '#E5E1DA' : 'var(--bg-primary)',
        color: 'var(--text-primary)' 
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between relative">
        {/* Left side - View Classes button for instructors */}
        <div className="absolute left-4 z-10">
          {userData?.role === 'instructor' && (
            <button 
              onClick={() => {
                fetchInstructorClasses();
                setShowClassesModal(true);
              }}
              className="flex items-center justify-center hover:bg-gray-800 transition-colors ml-10 mt-1"
              title="Mark Classes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </button>
          )}
        </div>

        {/* Center - Logo */}
        <div className="flex-1 flex justify-center">
          {theme === 'light' ? (
            <img 
              src={lightModeLogo}
              alt="FIT TIME"
              className="h-12 w-auto mt-2 mb-2"
            />
          ) : (
            <img 
              src={darkModeLogo}
              alt="FIT TIME"
              className="h-16 w-auto"
            />
          )}
        </div>
        <div className="absolute right-14 mt-2 ">
          <div className="relative">
            <button 
              className={`p-2 hover:text-emerald-500 transition-colors ${
                theme === 'light' ? 'text-black' : 'text-white'
              }`}
              onClick={() => setShowSidebar(true)}
            >
              <FaCog className="h-6 w-6" />
            </button>
            
            {/* Sidebar */}
            <AnimatePresence>
              {showSidebar && (
                <>
                  {/* Backdrop with fade animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setShowSidebar(false)}
                  />
                  
                  {/* Sidebar with slide animation */}
                  <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 30
                    }}
                    className="fixed right-0 top-0 w-80 bg-[#1a1f2a] h-full z-50 shadow-lg"
                  >
                    {/* Header with back arrow - updated to center text */}
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="flex items-center justify-between p-6 border-b border-gray-700"
                    >
                      <button 
                        onClick={() => setShowSidebar(false)}
                        className="text-white hover:text-emerald-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-xl font-semibold text-white flex-1 ml-16">SETTINGS</span>
                      <div className="w-6"></div>
                    </motion.div>

                    {/* Profile Section with staggered animation - excluding logout */}
                    <div>
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-transparent">
                          <div className="flex items-center space-x-4">
                            {userData?.profilePicture ? (
                              <img
                                src={`http://localhost:5000${userData.profilePicture}`}
                                alt="Profile"
                                className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/64?text=Profile';
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center ring-2 ring-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-white text-lg">{userData?.name}</div>
                              <div className="text-sm text-emerald-400">{userData?.email}</div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-4">
                          <button className="w-full px-6 py-3 text-left text-white hover:bg-gray-800/50 flex items-center space-x-3 group transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            <span className="group-hover:text-emerald-500 transition-colors">LANGUAGE</span>
                          </button>
                          <button 
                            onClick={handleAboutClick}
                            className="w-full px-6 py-3 text-left text-white hover:bg-gray-800/50 flex items-center space-x-3 group transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="group-hover:text-emerald-500 transition-colors">ABOUT US</span>
                          </button>
                          <button 
                            onClick={handlePrivacyClick}
                            className="w-full px-6 py-3 text-left text-white hover:bg-gray-800/50 flex items-center space-x-3 group transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="group-hover:text-emerald-500 transition-colors">PRIVACY POLICY</span>
                          </button>
                          <button 
                            onClick={handleTermsClick}
                            className="w-full px-6 py-3 text-left text-white hover:bg-gray-800/50 flex items-center space-x-3 group transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.33 2.477-4.5 1.253" />
                            </svg>
                            <span className="group-hover:text-emerald-500 transition-colors">TERMS & CONDITIONS</span>
                          </button>
                          <button 
                            onClick={() => setShowContactDialog(true)} 
                            className="w-full px-6 py-3 text-left text-white hover:bg-gray-800/50 flex items-center space-x-3 group transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="group-hover:text-emerald-500 transition-colors">CONTACT US</span>
                          </button>
                        </div>
                      </motion.div>

                      {/* Logout Button - No animation */}
                      <div className="absolute bottom-0 w-full border-t border-white/20">
                        <button 
                          onClick={() => setShowLogoutDialog(true)}
                          className="w-full px-8 py-6 flex justify-end items-center hover:bg-red-500/10 transition-colors duration-200 group"
                        >
                          <div className="flex items-center space-x-2">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5 text-red-500 group-hover:text-red-400" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                              />
                            </svg>
                            <span className="text-red-500 group-hover:text-red-400 transition-colors text-sm tracking-wide">
                              LOGOUT
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4">
        <div className={`max-w-md mx-auto p-5 ${
          theme === 'light' ? 'bg-[#B3C8CF]' : 'bg-[#1a1f2a]'
        } rounded-lg shadow-lg`}>
          <h1 className={`text-3xl font-bold mb-4 ${
            theme === 'light' ? 'text-black' : 'text-white'
          }`}>Profile</h1>
          <div className={`${
            theme === 'light' ? 'bg-[#B3C8CF]' : 'bg-[#1a1f2a]'
          } rounded-xl p-6 flex flex-col items-center relative`}>
            {isInstructor && (
              <div className="absolute top-4 left-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-base font-semibold">
                  Instructor
                </span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#1a1f2a] mb-4 relative group">
                {userData?.profilePicture ? (
                  <img
                    src={`http://localhost:5000${userData.profilePicture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/128?text=Profile';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-semibold mb-2">{userData?.name}</h2>
              <p className="text-base text-gray-400 mb-4">{userData?.email}</p>
              <button
                onClick={() => navigate('/edit-profile')}
                className="bg-emerald-500 text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-emerald-600 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons Outside Profile Container */}
      <div className="px-6 mt-6 space-y-4">
        {!isInstructor && (
          <button
            onClick={() => setShowUpgradeDialog(true)}
            className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Upgrade to Instructor</span>
          </button>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className={`mt-8 rounded-lg shadow-lg p-4 ${
        theme === 'light' ? 'bg-[#B3C8CF]' : 'bg-[#1a1f2a]'
      }`}>
        <h2 className={`text-2xl font-bold mb-3 ${
          theme === 'light' ? 'text-black' : 'text-white'
        }`}>Recent Activity</h2>
        <div className="space-y-2">
          {recentBookings.map((booking) => (
            <div
              key={booking.id}
              className={`px-3 py-2 rounded-lg flex items-center group ${
                theme === 'light' ? 'bg-[#B3C8CF]' : 'bg-[#1a1f2a]'
              }`}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              <span className={`text-base ${
                theme === 'light' ? 'text-black' : 'text-white'
              }`}>
                {booking.className}
              </span>
              <div className={`ml-auto flex items-center text-xs ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                <span>{new Date(booking.date).toLocaleDateString()}</span>
                <span className="mx-1">•</span>
                <span>{formatTime(booking.time)}</span>
              </div>
            </div>
          ))}
          {recentBookings.length === 0 && (
            <div className={`text-center py-4 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              <span className="text-sm">No recent bookings</span>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler for share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowShareMenu(false);
            setSelectedBooking(null);
          }}
        />
      )}

      {/* Create/Edit Class Dialog */}
      {showCreateClassDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2a] rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h2>
            </div>
            
            {/* Category Selection */}
            <div className="mb-5 relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={classData.category}
                onChange={(e) => setClassData({ ...classData, category: e.target.value })}
                className="w-full bg-[#2a303c] text-white rounded-xl p-3 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1em' }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Date Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={classData.date}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  if (selectedDate < today) {
                    toast.error("Cannot select past dates");
                    return;
                  }
                  setClassData({ ...classData, date: e.target.value });
                }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-[#2a303c] text-white rounded-xl p-3 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            {/* Time Input */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
              <input
                type="time"
                value={classData.time}
                onChange={(e) => setClassData({ ...classData, time: e.target.value })}
                className="w-full bg-[#2a303c] text-white rounded-xl p-3 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>

            {/* Place Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Place</label>
              <div className="relative">
                <input
                  type="text"
                  value={classData.place}
                  onChange={(e) => setClassData({ ...classData, place: e.target.value })}
                  placeholder="Enter location"
                  className="w-full bg-[#2a303c] text-white rounded-xl p-3 pl-3 pr-10 border border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                />
                <FaMapMarkerAlt 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg cursor-pointer hover:text-emerald-500 transition-colors" 
                  onClick={() => {
                    setShowMapDialog(true);
                    setMap(null);
                    setSearchBox(null);
                    setSelectedPlace(null);
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={editingClass ? handleUpdateClass : handleCreateClass}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {editingClass ? 'Update Class' : 'Create Class'}
              </button>
              <button
                onClick={() => {
                  setShowCreateClassDialog(false);
                  setClassData({ category: '', date: '', time: '', place: '' });
                  setEditingClass(null);
                }}
                className="flex-1 bg-gray-600/50 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#202c34] rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Logout</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 bg-[#202c34] text-white hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Account</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This action cannot be undone. Type "delete" to confirm account deletion.
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Dialog */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#202c34] rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Upgrade to Instructor</h2>
            <p className="text-gray-400 mb-6">Are you sure you want to upgrade to instructor? This will allow you to create and manage classes.</p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  handleUpgrade();
                }}
                className="flex-1 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowUpgradeDialog(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* About Us Modal */}
      {showAboutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2a] rounded-lg p-6 max-w-md w-full relative">
            {/* Close button */}
            <button 
              onClick={() => setShowAboutDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo and Title */}
            <div className="flex items-center space-x-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">About Us</h2>
            </div>

            {/* Content */}
            <div className="text-gray-300 space-y-4">
              <p>
                Your all-in-one platform to find, book, and keep track of fitness classes, wherever you are. 
                Whether you're looking for the nearest studio or want to try out the top-rated instructors, we 
                make it easy to browse and reserve the best classes to fit your schedule and fitness goals.
              </p>
              <p>
                With FITTIME, you can browse and reserve a variety of classes, from yoga and cardio to 
                strength training and more. Find options near you or explore something new — all at prices 
                that fit your budget. Wherever you are in your fitness journey, we're here to help you make 
                the most of every workout.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2a] rounded-lg p-6 max-w-md w-full relative">
            {/* Close button */}
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo and Title */}
            <div className="flex items-center space-x-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
            </div>

            {/* Content */}
            <div className="text-gray-300 space-y-4">
              <p>
                We're on a mission to make fitness accessible to everyone, offering a smooth, easy way to book the best classes at affordable rates.
              </p>
              <p>
                With FITTIME, you can browse and reserve a variety of classes, from yoga and cardio to 
                strength training and more. Find options near you or explore something new — all at prices 
                that fit your budget. Wherever you are in your fitness journey, we're here to help you make 
                the most of every workout.
              </p>
            </div>

            {/* Close button */}
        
          </div>
        </div>
      )}
      
      {/* Terms and Conditions Modal */}
      {showTermsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2a] rounded-lg p-6 max-w-md w-full relative">
            {/* Close button */}
            <button 
              onClick={() => setShowTermsDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo and Title */}
            <div className="flex items-center space-x-3 mb-4">    
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.33 2.477-4.5 1.253" />
            </svg>
              <h2 className="text-2xl font-bold text-white">Terms & Conditions</h2>
            </div>

            {/* Content */}
            <div className="text-gray-300 space-y-4">
              <p>
                <div ></div>
                By using FITTIME, you agree to these terms and conditions. Our platform connects fitness enthusiasts with quality fitness classes and instructors.
              </p>
              <p>
                1. Membership and Booking
                • You must be 18 or older to create an account
                • Class bookings are subject to availability
                • Cancellations must be made 24 hours in advance
              </p>
              <p>
                2. Payment and Refunds
                • All payments are processed securely
                • Refunds are available for cancelled classes
                • Membership fees are non-refundable
              </p>
              <p>
                3. User Conduct
                • Respect instructors and other users
                • Arrive on time for booked classes
                • Follow studio and class guidelines
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Map Dialog */}
      {showMapDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1f2a] rounded-2xl p-6 w-full max-w-4xl border border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Select Location</h2>
              <button
                onClick={handleCloseMapDialog}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="w-full h-[400px] relative">
              <MapContainer
                center={[0, 0]}
                zoom={2}
                style={{ height: '100%', width: '100%' }}
                whenCreated={setMap}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {selectedPlace && <Marker position={mapPosition} />}
                <MapComponent />
              </MapContainer>
            </div>

            <div className="mt-4 text-sm text-gray-400">
              Click on the map or search for a location to select it
            </div>
          </div>
        </div>
      )}
      
      {/* Classes Modal */}
      {showClassesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-[#1a1f2a] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
            {/* Close button */}
            <button 
              onClick={() => setShowClassesModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <div className="flex items-center space-x-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <h2 className="text-2xl font-bold text-white">Your Classes</h2>
            </div>

            {/* Classes List */}
            <div className="space-y-4">
              {instructorClasses.length === 0 ? (
                <p className="text-gray-400 text-center py-8">You haven't created any classes yet.</p>
              ) : (
                instructorClasses.map((classItem) => (
                  <div 
                    key={classItem._id} 
                    className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{classItem.category}</h3>
                      <div className="text-gray-400 space-y-1 mt-1">
                        <p>Date: {new Date(classItem.date).toLocaleDateString()}</p>
                        <p>Time: {formatTime(classItem.time)}</p>
                        <p>Place: {classItem.place}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditClass(classItem)}
                      className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                      title="Edit Class"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClassClick(classItem._id)}
                      className="p-2 text-gray-400 hover:text-emerald-500 transition-colors"
                      title="Delete Class"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Class Confirmation Dialog */}
      {showDeleteClassDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1F2937] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Class</h3>
            <p className="text-gray-300 mb-6">Are you sure you want to delete this class?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDeleteClass}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteClass}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Us Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1F2937] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Contact Us</h3>
              <button 
                onClick={() => setShowContactDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your email"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  id="message"
                  rows="4"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Your message"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ProfileNavbar 
        isInstructor={isInstructor} 
        onCreateClass={() => setShowCreateClassDialog(true)}
        theme={theme}
      />
    </div>
  );
};

export default Profile;