import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import ob5 from '../assets/OB5.png';
import { setOnboardingComplete } from '../utils/onboardingToken';

const Onboarding5 = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    setOnboardingComplete();
    navigate('/logo-animation');
  };

  const containerVariants = {
    hidden: { 
      opacity: 1
    },
    visible: {
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    },
    exit: {
      opacity: 1
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="h-screen w-full bg-#1F2937 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Logo */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <img 
          src={logo} 
          alt="FitTime Logo" 
          className="h-16"
        />
      </div>

      <div className="flex flex-col h-full px-6 pb-8">
        {/* Main image */}
        <motion.div 
          className="flex-1 flex items-center justify-center"
          variants={itemVariants}
        >
          <img 
            src={ob5} 
            alt="Fitness Illustration" 
            className="w-[100%] max-w-[700px] object-contain mx-auto scale-125"
          />
        </motion.div>

        {/* Text content */}
        <div className="space-y-4">
          <motion.h1 
            className="text-white text-3xl font-bold leading-tight mb-20"
            variants={itemVariants}
          >
            You're all set! Start exploring and booking classes today.
          </motion.h1>

          {/* Next button and dots - no animation */}
          <div>
            <button 
              className="w-full bg-white text-gray-900 py-4 rounded-full font-semibold text-lg"
              onClick={handleComplete}
            >
              Proceed
            </button>

            <div className="flex justify-center space-x-2 pt-4">
              <div 
                className="w-2 h-2 bg-gray-500 rounded-full cursor-pointer"
                onClick={() => navigate('/')}
              ></div>
              <div 
                className="w-2 h-2 bg-gray-500 rounded-full cursor-pointer"
                onClick={() => navigate('/onboarding2')}
              ></div>
              <div 
                className="w-2 h-2 bg-gray-500 rounded-full cursor-pointer"
                onClick={() => navigate('/onboarding3')}
              ></div>
              <div 
                className="w-2 h-2 bg-gray-500 rounded-full cursor-pointer"
                onClick={() => navigate('/onboarding4')}
              ></div>
              <div className="w-6 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding5;
