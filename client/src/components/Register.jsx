// client/src/components/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import logo from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    acceptTerms: false
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
      toast.error('Please use a valid Gmail address (@gmail.com)');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data) {
        setFormData({
          name: '',
          email: '',
          password: '',
          acceptTerms: false
        });
        
        // Add delay before showing success and redirecting
        setTimeout(() => {
          toast.success('Account registered successfully! Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 5000);
        }, 2000);
      }
    } catch (err) {
      setIsLoading(false);
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-[#1F2937] to-#111827 px-4 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Arrow */}
      <motion.div 
        className="ml-10 mb-4 pt-20"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button 
          onClick={() => navigate('/welcome')} 
          className="text-white hover:text-[#10B981] transition-colors duration-300"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
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
      </motion.div>

      {/* Logo */}
      <motion.div 
        className="flex justify-center mb-10 -mt-20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img 
          src={logo} 
          alt="FIT TIME Logo" 
          className="h-24 w-auto drop-shadow-2xl -mt-4"
        />
      </motion.div>

      {/* Welcome Text */}
      <motion.div 
        className="mb-8 px-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-white text-xl mb-1 font-light tracking-wide">WELCOME!</h2>
        <h1 className="text-[#10B981] text-3xl font-bold tracking-tight">Create an Account</h1>
      </motion.div>

      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="space-y-2">
          <label className="text-white text-sm font-medium ml-1">Name</label>
          <div className="relative group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all duration-300"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm font-medium ml-1">Email</label>
          <div className="relative group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all duration-300"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-white text-sm font-medium ml-1">Password</label>
          <div className="relative group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-full text-white focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/20 transition-all duration-300"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:text-[#10B981] transition-colors duration-300"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-[#10B981] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-[#10B981] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-6 ml-6">
          <input
            type="checkbox"
            id="acceptTerms"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            className="w-4 h-4 text-[#10B981] bg-gray-800/50 border-gray-600 rounded focus:ring-[#10B981] focus:ring-2"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-300">
            I accept the terms and conditions
          </label>
        </div>

        <motion.button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-[#10B981]/20 transform hover:-translate-y-0.5 transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </div>
          ) : (
            'Create Account'
          )}
        </motion.button>
      </motion.form>
    </motion.div>
  );
}

export default Register;