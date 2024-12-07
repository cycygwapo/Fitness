import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import lightmodelogo from '../assets/lightmodelogo.png';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import config from '../config';

function Header({ userData }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userData) {  // Only fetch if user is logged in
      fetchNotifications();
    }
  }, [userData]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => !n.read).length);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('No auth token found');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      {/* Profile Picture */}
      <button 
        onClick={() => navigate('/profile')}
        className="w-10 h-10 rounded-full overflow-hidden bg-[#1a1f2a] flex-shrink-0 ml-9 mt-4"
      >
        {userData?.profilePicture ? (
          <img
            src={`${import.meta.env.VITE_API_URL}${userData.profilePicture}`}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/40?text=Profile';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </button>

      {/* Logo */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        {theme === 'light' ? (
          <img 
            src={lightmodelogo}
            alt="FIT TIME"
            className="h-16 w-auto"
          />
        ) : (
          <img 
            src={logo}
            alt="FIT TIME"
            className="h-16 w-auto mt-2"
          />
        )}
      </div>

      {/* Notification Bell */}
      <div className="w-10 h-10 flex items-center justify-center text-white mt-4 mr-10">
        <NotificationBell 
          notifications={notifications} 
          showNotifications={showNotifications} 
          setShowNotifications={setShowNotifications} 
          unreadCount={unreadCount} 
          markAsRead={markAsRead} 
          error={error} 
        />
      </div>
    </div>
  );
}

export default Header;
