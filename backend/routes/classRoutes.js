const express = require('express');
const router = express.Router();
const Class = require('../models/classModel');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Debug middleware for this router
router.use((req, res, next) => {
  console.log(`Class Route - ${req.method} ${req.path}`);
  next();
});

// Get instructor's created classes
router.get('/instructor-classes', auth, async (req, res) => {
  console.log('Accessing instructor-classes route');
  console.log('User:', req.user);
  
  try {
    if (!req.user || !req.user.role) {
      console.log('No user or role found:', req.user);
      return res.status(403).json({ 
        success: false,
        message: 'User role not found' 
      });
    }

    if (req.user.role !== 'instructor') {
      console.log('User is not an instructor:', req.user.role);
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Only instructors can view their classes.' 
      });
    }

    console.log('Finding classes for instructor:', req.user._id);
    const classes = await Class.find({ instructor: req.user._id })
      .sort({ date: 1, time: 1 });

    console.log('Found classes details:', classes);
    console.log('Found classes:', classes.length);
    res.json({ 
      success: true,
      classes 
    });
  } catch (error) {
    console.error('Error in /instructor-classes:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error',
      error: error.message 
    });
  }
});

// Get all classes
router.get('/', async (req, res) => {
  console.log('Accessing all classes route');
  
  try {
    console.log('Finding all classes');
    const classes = await Class.find()
      .populate('instructor', 'name email')
      .sort({ date: 1, time: 1 });
    console.log('Found classes:', classes.length);
    res.json(classes);
  } catch (error) {
    console.error('Error in /classes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new class (instructors only)
router.post('/', auth, async (req, res) => {
  console.log('Accessing create class route');
  console.log('User:', req.user);
  console.log('Request body:', req.body);
  
  try {
    const { category, exerciseType, date, time, place, maxParticipants } = req.body;
    console.log('Exercise Type:', exerciseType);
    
    if (!req.user || !req.user.role) {
      console.log('No user or role found:', req.user);
      return res.status(403).json({ message: 'User role not found' });
    }
    
    if (req.user.role !== 'instructor') {
      console.log('User is not an instructor:', req.user.role);
      return res.status(403).json({ message: 'Only instructors can create classes' });
    }
    
    console.log('Creating new class:', req.body);
    const newClass = new Class({
      instructor: req.user._id,
      instructorName: req.user.name,
      category,
      exerciseType,
      date,
      time,
      place,
      maxParticipants,
      participants: []
    });

    const savedClass = await newClass.save();
    console.log('Class created:', savedClass);
    res.status(201).json(savedClass);
  } catch (error) {
    console.error('Error in /classes:', error);
    res.status(400).json({ message: error.message });
  }
});

// Book a class
router.post('/:id/book', auth, async (req, res) => {
  console.log('Accessing book class route');
  console.log('User:', req.user);
  
  try {
    const classId = req.params.id;
    const userId = req.user._id;

    console.log('Finding class to book:', classId);
    const classToBook = await Class.findById(classId);
    if (!classToBook) {
      console.log('Class not found:', classId);
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if class is already booked by the user
    if (classToBook.participants.includes(userId)) {
      console.log('User has already booked this class:', userId);
      return res.status(400).json({ message: 'You have already booked this class' });
    }

    // Check if class is full
    if (classToBook.participants.length >= classToBook.maxParticipants) {
      console.log('Class is full:', classToBook.maxParticipants);
      return res.status(400).json({ message: 'Class is full' });
    }

    console.log('Booking class:', classToBook);
    // Create a new booking
    const booking = new Booking({
      userId,
      classId: classToBook._id,
      className: classToBook.category,
      exerciseType: classToBook.exerciseType,
      instructor: classToBook.instructor,
      date: classToBook.date,
      time: classToBook.time,
      place: classToBook.place,
      status: 'confirmed'
    });

    // Add user to class participants
    classToBook.participants.push(userId);

    // Save both the booking and updated class
    await Promise.all([
      booking.save(),
      classToBook.save()
    ]);

    console.log('Class booked:', booking);
    res.json({ 
      message: 'Class booked successfully',
      booking
    });
  } catch (error) {
    console.error('Error in /book class:', error);
    res.status(500).json({ message: 'Failed to book class', error: error.message });
  }
});

// Get user's booked classes
router.get('/my-classes', auth, async (req, res) => {
  console.log('Accessing my classes route');
  console.log('User:', req.user);
  
  try {
    console.log('Finding booked classes for user:', req.user._id);
    const classes = await Class.find({
      participants: req.user._id
    }).populate('instructor', 'name email');
    console.log('Found classes:', classes.length);
    res.json(classes);
  } catch (error) {
    console.error('Error in /my-classes:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a class
router.put('/:id', auth, async (req, res) => {
  console.log('Accessing update class route');
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only instructors can update classes.'
      });
    }

    const { category, exerciseType, date, time, place } = req.body;
    const classId = req.params.id;

    const classToUpdate = await Class.findById(classId);
    if (!classToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify that the instructor owns this class
    if (classToUpdate.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own classes.'
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { category, exerciseType, date, time, place },
      { new: true }
    );

    res.json({
      success: true,
      class: updatedClass
    });
  } catch (error) {
    console.error('Error in update class route:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Delete a class (instructors only)
router.delete('/:id', auth, async (req, res) => {
  console.log('Accessing delete class route');
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only instructors can delete classes.'
      });
    }

    const classId = req.params.id;
    const classToDelete = await Class.findById(classId);

    if (!classToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Verify that the instructor owns this class
    if (classToDelete.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own classes.'
      });
    }

    // Delete related bookings first
    await Booking.deleteMany({ classId: classId });

    // Delete the class
    await Class.findByIdAndDelete(classId);

    res.json({
      success: true,
      message: 'Class and related bookings deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete class route:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = router;
