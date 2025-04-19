const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officerName: {
    type: String,
    required: true
  },
  feedback: {
    type: String,
    enum: ['Not able to pay', 'Within 3 months', 'Within 6 months', 'Installment'],
    required: true
  },
  description: {
    type: String
  },
  images: [{
    type: String // URLs to stored images
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String
    }
  }
}, {
  timestamps: true
});

// Create index for faster queries
visitSchema.index({ customerId: 1 });
visitSchema.index({ officerId: 1 });
visitSchema.index({ visitDate: 1 });

module.exports = mongoose.model('Visit', visitSchema);
