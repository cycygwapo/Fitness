import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './styles/theme.css';
import { AnimatePresence } from 'framer-motion';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Home from './components/Home.jsx';
import Profile from './components/Profile.jsx';
import EditProfile from './components/EditProfile.jsx';
import Welcome from './components/Welcome.jsx';
import Bookings from './components/Bookings.jsx';
import Calendar from './components/Calendar.jsx';
import Booking from './components/Booking.jsx';
import LogoAnimation1 from './components/animation1.jsx';
import LogoAnimation2 from './components/animation2.jsx';
import Onboarding1 from './components/onboarding1.jsx';
import Onboarding2 from './components/onboarding2.jsx';
import Onboarding3 from './components/onboarding3.jsx';
import Onboarding4 from './components/onboarding4.jsx';
import Onboarding5 from './components/onboarding5.jsx';

// Create Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LogoAnimation1 />} />
        <Route path="/onboarding1" element={<Onboarding1 />} />
        <Route path="/onboarding2" element={<Onboarding2 />} />
        <Route path="/onboarding3" element={<Onboarding3 />} />
        <Route path="/onboarding4" element={<Onboarding4 />} />
        <Route path="/onboarding5" element={<Onboarding5 />} />
        <Route path="/logo-animation" element={<LogoAnimation2 />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        } />
        <Route path="/booking" element={
          <ProtectedRoute>
            <Booking />
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/edit-profile" element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className={`min-h-screen flex flex-col bg-${theme} text-${theme}`}>
          <main className="flex-grow">
            <AnimatedRoutes />
          </main>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme}
        />
      </Router>
    </ThemeProvider>
  );
}

export default App;