import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        setError('No auth token found');
        return;
      }

      const response = await fetch('https://fitness-mmqs.onrender.com/api/notifications', {
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
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`https://fitness-mmqs.onrender.com/api/notifications/${notificationId}/read`, {
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
    <div className="relative">
      <button 
        className="relative p-2 rounded-full hover:bg-gray-800 transition-colors duration-200"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FaBell className="h-6 w-6 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-[#1F2937] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50">
          <div className="w-full max-w-md bg-[#202c34] rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                {notifications.length > 0 && (
                  <span className="text-sm text-gray-400">{unreadCount} unread</span>
                )}
              </div>
            </div>
            
            <div className="max-h-[70vh] overflow-y-auto">
              {error ? (
                <div className="p-4 text-red-400 text-center">
                  <span className="block mb-1">🚫</span>
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-gray-400 text-center">
                  <span className="block text-3xl mb-2">🔔</span>
                  <p className="text-base font-medium">No notifications yet</p>
                  
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    onClick={() => markAsRead(notification._id)}
                    className={`p-4 border-b border-gray-700 hover:bg-gray-800/50 cursor-pointer transition-all duration-200 ${
                      !notification.read ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                        !notification.read ? 'bg-red-500' : 'bg-gray-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white mb-1 break-words line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-300 break-words line-clamp-3">
                          {notification.message}
                        </p>
                        <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                          <span>{new Date(notification.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                          {!notification.read && (
                            <span className="ml-2 text-red-500 text-xs">New</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 bg-[#1a1f2a] border-t border-gray-700">
              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full py-2.5 px-4 text-sm text-gray-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-gray-800/50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
