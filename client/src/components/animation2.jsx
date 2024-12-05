import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import dumbbell from '../assets/dumbell.png';

const LogoAnimation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/welcome');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const dumbbellVariants = {
    initial: {
      y: -200,
      rotate: -30,
      scale: 0,
      opacity: 0
    },
    bounce: {
      y: [null, 70, -50, 50, 0],
      rotate: [-30, 0, -15, 0, 0],
      scale: [null, 1.2, 1, 1.1, 1],
      opacity: [0, 1, 1, 1, 0],
      transition: {
        duration: 1.5,
        times: [0, 0.4, 0.6, 0.8, 1],
        ease: "easeOut"
      }
    }
  };

  const logoVariants = {
    initial: {
      scale: 0,
      opacity: 0,
    },
    animate: {
      scale: [0, 1.2, 1],
      opacity: 1,
      transition: {
        delay: 1.5,
        duration: 0.8,
        times: [0, 0.6, 1],
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-#1F2937"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Dumbbell */}
        <motion.div
          className="absolute"
          variants={dumbbellVariants}
          initial="initial"
          animate="bounce"
        >
          <motion.img
            src={dumbbell}
            alt="Dumbbell"
            className="w-35 h-35 object-contain"
            style={{
            }}
          />
        </motion.div>

        {/* Logo */}
        <motion.div
          className="absolute"
          variants={logoVariants}
          initial="initial"
          animate="animate"
        >
          <motion.img
            src={logo}
            alt="FitTime Logo"
            className="w-50 h-50 object-contain"
            style={{
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LogoAnimation;
