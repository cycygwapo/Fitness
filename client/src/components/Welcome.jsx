import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

function Welcome() {
  const navigate = useNavigate();

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
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
      className="min-h-screen bg-#1F2937 flex flex-col items-center justify-center px-4"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div 
        className="w-full max-w-md flex flex-col items-center space-y-6"
        variants={containerVariants}
      >
        {/* Logo Section */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <motion.img 
            src={logo} 
            alt="FIT TIME Logo" 
            className="h-32 w-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
        </motion.div>

        {/* Buttons */}
        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/login')}
          className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Log In
        </motion.button>

        <motion.div 
          className="flex items-center w-full"
          variants={itemVariants}
        >
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="px-4 text-gray-400">Or</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </motion.div>

        <motion.button
          variants={itemVariants}
          onClick={() => navigate('/register')}
          className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-900 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Create an account
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export default Welcome;