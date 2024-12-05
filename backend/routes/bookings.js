const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Class = require('../models/classModel');
const NotificationModel = require('../models/notification');

// Get all bookings for the logged-in user
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    //console.log('Fetching bookings for user:', userId); // Debug log
    // Get all active bookings for the user
    const bookings = await Booking.find({ 
      userId: req.user.id,
      status: 'booked'
    }).sort({ createdAt: -1 });
    //console.log('Found bookings for user:', bookings); // Debug log

    // Get all classes that the user has booked
    const bookedClasses = await Class.find({
      participants: req.user.id
    }).populate('instructor', 'name'); // Populate instructor details

    // Combine the information
    const bookingsData = await Promise.all(bookings.map(async booking => {
      const classInfo = await Class.findById(booking.classId).populate('instructor', 'name');
      return {
        id: booking._id,
        classId: booking.classId,
        className: booking.className,
        instructor: classInfo?.instructor?.name || booking.instructor,
        date: booking.date,
        time: booking.time,
        place: booking.place,
        status: booking.status
      };
    }));

    // Add class IDs from the classes collection
    const allBookedClassIds = [...new Set([
      ...bookingsData.map(b => b.classId),
      ...bookedClasses.map(c => c._id.toString())
    ])];

    res.json({
      success: true,
      bookings: bookingsData,
      bookedClassIds: allBookedClassIds
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// Book a class
router.post('/book-class', auth, async (req, res) => {
  try {
    const { classId, className, date, time, place } = req.body;

    console.log('Booking request:', { classId, className, date, time, place }); // Debug log

    // Validate required fields
    if (!classId || !className || !date || !time || !place) {
      console.log('Invalid booking request:', { classId, className, date, time, place });
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if the class exists and get instructor details
    const classToBook = await Class.findById(classId);
    if (!classToBook) {
      console.log('Class not found:', classId);
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Populate instructor details
    await classToBook.populate('instructor', 'name');
    if (!classToBook.instructor) {
      console.log('Instructor information not found:', classId);
      return res.status(400).json({
        success: false,
        message: 'Instructor information not found'
      });
    }

    // Check if user is already in participants
    if (classToBook.participants && classToBook.participants.includes(req.user.id)) {
      console.log('User already booked this class:', { classId, userId: req.user.id });
      return res.status(400).json({
        success: false,
        message: 'You have already booked this class'
      });
    }

    // Check if class is full
    if (classToBook.participants && classToBook.participants.length >= classToBook.maxParticipants) {
      console.log('Class is full:', classId);
      return res.status(400).json({
        success: false,
        message: 'Class is full'
      });
    }

    // Check for existing booking
    const existingBooking = await Booking.findOne({
      userId: req.user.id,
      classId: classId
    });

    let booking;

    if (existingBooking) {
      // If there's an existing booking and it's cancelled, update it
      if (existingBooking.status === 'cancelled') {
        existingBooking.status = 'booked';
        booking = await existingBooking.save();
        
        // Add user back to participants
        if (!classToBook.participants.includes(req.user.id)) {
          classToBook.participants.push(req.user.id);
          await classToBook.save();
        }
      } else {
        console.log('User already has an active booking for this class:', { classId, userId: req.user.id });
        return res.status(400).json({
          success: false,
          message: 'You already have an active booking for this class'
        });
      }
    } else {
      // Create new booking if none exists
      booking = await Booking.create({
        userId: req.user.id,
        classId,
        className,
        instructor: classToBook.instructor.name,
        date,
        time,
        place,
        status: 'booked'
      });

      // Add user to participants
      if (!classToBook.participants.includes(req.user.id)) {
        classToBook.participants.push(req.user.id);
        await classToBook.save();
      }
    }

    console.log('Booking successful:', booking); // Debug log

    // Create a notification for the booking
    const notification = new NotificationModel({
      userId: req.user.id,
      title: 'Class Booked Successfully',
      message: `You have booked ${className} on ${new Date(date).toLocaleDateString()} at ${time}`,
      type: 'booking',
      classId: classId
    });
    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Class booked successfully',
      booking: {
        id: booking._id,
        classId: booking.classId,
        className: booking.className,
        instructor: booking.instructor,
        date: booking.date,
        time: booking.time,
        place: booking.place,
        status: booking.status
      },
      class: classToBook
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking class',
      error: error.message
    });
  }
});

// Cancel a booking
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    console.log('Cancel request:', { bookingId, userId }); // Debug log

    if (!bookingId) {
      console.log('No booking ID provided');
      return res.status(400).json({ success: false, message: 'No booking ID provided' });
    }

    // Find the booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: userId,
      status: 'booked'
    });
    
    if (!booking) {
      console.log('Booking not found:', { bookingId, userId });
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('Found booking to cancel:', booking);

    // Remove user from class participants
    const classToUpdate = await Class.findById(booking.classId);
    if (classToUpdate) {
      classToUpdate.participants = classToUpdate.participants.filter(
        participantId => participantId.toString() !== req.user.id.toString()
      );
      await classToUpdate.save();
    }

    // Delete the booking instead of updating status
    await Booking.deleteOne({ _id: booking._id });
    console.log('Deleted booking');

    res.json({
      success: true,
      message: 'Booking cancelled and deleted successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// Cancel a booking by class ID
router.put('/class/:classId/cancel', auth, async (req, res) => {
  try {
    const classId = req.params.classId;
    const userId = req.user.id;

    console.log('Cancel request:', { classId, userId }); // Debug log

    // Find the booking for this class and user
    const booking = await Booking.findOne({
      classId: classId,
      userId: userId,
      status: 'booked'
    });

    if (!booking) {
      console.log('Booking not found:', { classId, userId });
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    console.log('Found booking to cancel:', booking);

    // Remove user from class participants
    const classToUpdate = await Class.findById(classId);
    if (classToUpdate) {
      classToUpdate.participants = classToUpdate.participants.filter(
        participantId => participantId.toString() !== req.user.id.toString()
      );
      await classToUpdate.save();
    }

    booking.status = 'cancelled';
    await booking.save();
    console.log('Updated booking status');

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        classId: booking.classId,
        className: booking.className,
        instructor: booking.instructor,
        date: booking.date,
        time: booking.time,
        place: booking.place,
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// Delete a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    console.log('Delete booking request:', { bookingId, userId });

    // Find the booking
    const booking = await Booking.findOne({ _id: bookingId, userId });

    if (!booking) {
      console.log('Booking not found:', { bookingId, userId });
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    console.log('Found booking to delete:', booking);

    // Delete the booking
    await Booking.deleteOne({ _id: bookingId });
    console.log('Deleted booking from database');

    // Remove user from class participants
    const updatedClass = await Class.findByIdAndUpdate(
      booking.classId,
      { $pull: { participants: userId } },
      { new: true }
    );
    console.log('Updated class participants:', updatedClass);

    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting booking',
      error: error.message 
    });
  }
});

module.exports = router;
