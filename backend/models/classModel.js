const mongoose = require('mongoose');

const classSchema = mongoose.Schema(
    {
        instructor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        instructorName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true,
            enum: ['Cardio', 'Flexibility', 'Strength Training', 'Yoga', 'Meditation']
        },
        exerciseType: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        time: {
            type: String,
            required: true
        },
        place: {
            type: String,
            required: true
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        maxParticipants: {
            type: Number,
            default: 20
        }
    },
    {
        timestamps: true
    }
);

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
