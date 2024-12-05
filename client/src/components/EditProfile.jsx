import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import logo from '../assets/logo.png';
import config from '../config';

function EditProfile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData);
      setUserData(parsedData);
      setFormData(prev => ({
        ...prev,
        name: parsedData.name,
        email: parsedData.email
      }));
      if (parsedData.profilePicture) {
        setPreviewUrl(`${config.BASE_URL}${parsedData.profilePicture}`);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear password error when user starts typing
    if (['currentPassword', 'newPassword', 'confirmPassword'].includes(name)) {
      setPasswordError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePasswords = () => {
    if (formData.newPassword && !formData.currentPassword) {
      setPasswordError('Please enter your current password');
      return false;
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswords()) return;
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.newPassword) {
        formDataToSend.append('currentPassword', formData.currentPassword);
        formDataToSend.append('newPassword', formData.newPassword);
      }
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_URL}/users/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      localStorage.setItem('userData', JSON.stringify({
        ...userData,
        ...data.user
      }));

      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error(error.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    try {
      const token = localStorage.getItem('userToken');
      await axios.delete(`${config.API_URL}/users/delete-account`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(error.response?.data?.message || 'Error deleting account');
    }
    setShowDeleteModal(false);
  };

  const handleCameraCapture = async () => {
    try {
      // Request both front and back cameras with preferred front camera
      const constraints = {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      // First try to get the camera
      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        // Wait for video to be ready
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      // If front camera fails, try back camera
      try {
        const backCameraConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        streamRef.current = await navigator.mediaDevices.getUserMedia(backCameraConstraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
        }
      } catch (backError) {
        console.error('Error accessing back camera:', backError);
        toast.error('Unable to access camera. Please check camera permissions.');
        setShowImageOptions(false);
      }
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      try {
        // Create a canvas with the video dimensions
        const canvas = document.createElement('canvas');
        const aspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
        
        // Set canvas size to maintain aspect ratio
        const maxSize = 1280;
        let width = maxSize;
        let height = maxSize / aspectRatio;
        
        if (height > maxSize) {
          height = maxSize;
          width = maxSize * aspectRatio;
        }
        
        canvas.width = width;
        canvas.height = height;

        // Draw the video frame to canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Convert to blob with quality setting
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'camera-capture.jpg', { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            setProfilePicture(file);
            setPreviewUrl(canvas.toDataURL('image/jpeg', 0.8));
            toast.success('Photo captured successfully!');
          }
        }, 'image/jpeg', 0.8);

      } catch (error) {
        console.error('Error capturing photo:', error);
        toast.error('Failed to capture photo. Please try again.');
      } finally {
        // Always cleanup camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setShowImageOptions(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowImageOptions(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1f2a] text-white">
      {/* Back button */}
      <div className="p-2 flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="text-white hover:text-gray-300 ml-10 mt-12"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Form content - Reduced top margin */}
      <div className="max-w-md mx-auto px-6 -mt-12 mb-12">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 rounded-full border-2 border-emerald-500 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-600" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowImageOptions(true)}
              className="bg-emerald-500 text-white px-4 py-1 rounded-lg text-sm"
            >
              Choose Profile Picture
            </button>

            {/* Image Options Modal */}
            {showImageOptions && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 mt-12">
                <div className="bg-[#1a1f2a] p-6 rounded-lg w-full max-w-sm mx-4">
                  {streamRef.current ? (
                    <div className="space-y-4">
                      <div className="relative">
                        <video
                          ref={videoRef}
                          className="w-full rounded-lg bg-black"
                          autoPlay
                          playsInline
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full max-w-[80%] h-0 border-2 border-white opacity-50 border-dashed rounded-full aspect-square"></div>
                        </div>
                      </div>
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={handleCapture}
                          className="bg-emerald-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-emerald-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                          <span>Capture</span>
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="bg-red-500 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-4 text-center">Choose Option</h3>
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={handleCameraCapture}
                          className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
                        >
                          Take Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('profilePicture').click()}
                          className="w-full bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600"
                        >
                          Choose from Files
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowImageOptions(false)}
                          className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <input
              id="profilePicture"
              type="file"
              onChange={(e) => {
                handleFileChange(e);
                setShowImageOptions(false);
              }}
              className="hidden"
              accept="image/*"
            />
          </div>

          {/* Rest of the form fields */}
          <div className="space-y-3">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#2a2f3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#2a2f3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                required
              />
            </div>

            {/* Password Section */}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              
              {/* Current Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#2a2f3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#2a2f3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-[#2a2f3a] rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
              </div>

              {/* Password Error Message */}
              {passwordError && (
                <p className="text-red-500 text-sm mt-2">{passwordError}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 mb-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Delete Account Button */}
        <div className="max-w-md mx-auto">
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full bg-red-500/10 text-red-500 py-3 rounded-lg font-semibold hover:bg-red-500/20 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#2a2f3a] rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete Account</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your account?
            </p>
            
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder='Type "delete" to confirm'
              className="w-full px-4 py-2 bg-[#1a1f2a] rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfile;
