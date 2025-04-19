const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const Visit = require('../models/visit.model');
const Customer = require('../models/customer.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = './uploads/visits';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `visit_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// @route   POST /api/visits
// @desc    Create a new visit record
// @access  Private (Officer only)
router.post('/', protect, authorize('OFFICER'), upload.array('images', 5), async (req, res) => {
  try {
    // Verify customer exists
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if officer is assigned to this customer
    if (customer.assignedTo !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to add visits for this customer' });
    }

    // Process uploaded images
    const imageUrls = req.files ? req.files.map(file => `/uploads/visits/${file.filename}`) : [];

    // Create visit record
    const visit = new Visit({
      customerId: req.body.customerId,
      officerId: req.user.id,
      officerName: req.user.username,
      feedback: req.body.feedback,
      description: req.body.description,
      images: imageUrls,
      location: {
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude)
        ],
        address: req.body.address
      }
    });

    await visit.save();
    res.status(201).json(visit);
  } catch (err) {
    console.error('Error creating visit:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/visits/customer/:customerId
// @desc    Get all visits for a specific customer
// @access  Private
router.get('/customer/:customerId', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'ADMIN' && customer.assignedTo !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to view this customer\'s visits' });
    }

    const visits = await Visit.find({ customerId: req.params.customerId })
      .sort({ visitDate: -1 });

    res.json(visits);
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/visits/:id
// @desc    Get a specific visit by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Get the customer to check permissions
    const customer = await Customer.findById(visit.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Associated customer not found' });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'ADMIN' && customer.assignedTo !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to view this visit' });
    }

    res.json(visit);
  } catch (err) {
    console.error('Error fetching visit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/visits/:id
// @desc    Update a visit
// @access  Private (Officer only)
router.put('/:id', protect, authorize('OFFICER'), upload.array('newImages', 5), async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Check if officer created this visit
    if (visit.officerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this visit' });
    }

    // Process new uploaded images
    const newImageUrls = req.files ? req.files.map(file => `/uploads/visits/${file.filename}`) : [];
    
    // Combine existing images with new ones if needed
    const existingImages = req.body.keepImages ? JSON.parse(req.body.keepImages) : [];
    const allImages = [...existingImages, ...newImageUrls];

    // Update visit
    const updatedVisit = await Visit.findByIdAndUpdate(
      req.params.id,
      { 
        $set: {
          feedback: req.body.feedback,
          description: req.body.description,
          images: allImages,
          ...(req.body.longitude && req.body.latitude ? {
            location: {
              coordinates: [
                parseFloat(req.body.longitude),
                parseFloat(req.body.latitude)
              ],
              address: req.body.address
            }
          } : {})
        } 
      },
      { new: true }
    );

    res.json(updatedVisit);
  } catch (err) {
    console.error('Error updating visit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/visits/:id
// @desc    Delete a visit
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    // Delete associated images
    visit.images.forEach(imageUrl => {
      const imagePath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });

    await visit.remove();
    res.json({ message: 'Visit removed' });
  } catch (err) {
    console.error('Error deleting visit:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
