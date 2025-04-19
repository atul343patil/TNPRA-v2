const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const Customer = require('../models/customer.model');

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private (Admin/Officer)
router.post('/', protect, authorize('ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate entry found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/customers/bulk
// @desc    Create multiple customers
// @access  Private (Admin/Officer)
router.post('/bulk', protect, authorize('ADMIN', 'OFFICER'), async (req, res) => {
  try {
    // Process each customer individually to handle duplicates gracefully
    const results = {
      inserted: [],
      duplicates: [],
      errors: []
    };
    
    // Process each customer one by one
    for (const customer of req.body) {
      try {
        // Ensure we're using the correct field name for account number
        const accountNumber = customer.accountNumber || customer.ACCOUNT_NUMBER;
        const bankName = customer.bankName;
        const branchName = customer.branchName;
        console.log('Processing customer:', customer.accountNumber);
        console.log('Bank name:', bankName);
        console.log('Branch name:', branchName);
        
        if (!accountNumber) {
          results.errors.push({
            customer: customer,
            error: 'Missing account number'
          });
          continue;
        }
        
        if (!bankName) {
          results.errors.push({
            customer: customer,
            error: 'Missing bank name'
          });
          continue;
        }
        
        if (!branchName) {
          results.errors.push({
            customer: customer,
            error: 'Missing branch name'
          });
          continue;
        }
        
        // Directly insert each customer without duplicate checking
        // Normalize fields as before
        const normalizedCustomer = { ...customer };
        if (customer.ACCOUNT_NUMBER && !customer.accountNumber) {
          normalizedCustomer.accountNumber = customer.ACCOUNT_NUMBER;
          delete normalizedCustomer.ACCOUNT_NUMBER;
        }
        if (customer.OUTSTANDING_BALANCE && !customer.outstandingBalance) {
          normalizedCustomer.outstandingBalance = customer.OUTSTANDING_BALANCE;
          delete normalizedCustomer.OUTSTANDING_BALANCE;
        }
        if (customer.PRINCIPLE_OVERDUE && !customer.principleOverdue) {
          normalizedCustomer.principleOverdue = customer.PRINCIPLE_OVERDUE;
          delete normalizedCustomer.PRINCIPLE_OVERDUE;
        }
        if (customer.INTEREST_OVERDUE && !customer.interestOverdue) {
          normalizedCustomer.interestOverdue = customer.INTEREST_OVERDUE;
          delete normalizedCustomer.INTEREST_OVERDUE;
        }
        // Attempt to insert, catch MongoDB errors (like duplicate key)
        try {
          const newCustomer = new Customer(normalizedCustomer);
          await newCustomer.save();
          results.inserted.push(newCustomer);
        } catch (error) {
          results.errors.push({
            accountNumber: customer.accountNumber || customer.ACCOUNT_NUMBER,
            accountName: customer.accountName || customer.ACCOUNT_NAME,
            branchName: customer.branchName || customer.BRANCH_NAME,
            bankName: customer.bankName || customer.BANK_NAME,
            error: error.message
          });
        }
        continue;
        
        // Normalize field names if needed
        // const normalizedCustomer = { ...customer };
        
        // Ensure we're using the correct field names
        // if (customer.ACCOUNT_NUMBER && !customer.accountNumber) {
        //   normalizedCustomer.accountNumber = customer.ACCOUNT_NUMBER;
        //   delete normalizedCustomer.ACCOUNT_NUMBER;
        // }
        
        // if (customer.OUTSTANDING_BALANCE && !customer.outstandingBalance) {
        //   normalizedCustomer.outstandingBalance = customer.OUTSTANDING_BALANCE;
        //   delete normalizedCustomer.OUTSTANDING_BALANCE;
        // }
        
        // if (customer.PRINCIPLE_OVERDUE && !customer.principleOverdue) {
        //   normalizedCustomer.principleOverdue = customer.PRINCIPLE_OVERDUE;
        //   delete normalizedCustomer.PRINCIPLE_OVERDUE;
        // }
        
        // if (customer.INTEREST_OVERDUE && !customer.interestOverdue) {
        //   normalizedCustomer.interestOverdue = customer.INTEREST_OVERDUE;
        //   delete normalizedCustomer.INTEREST_OVERDUE;
        // }
        
        // Create and save the new customer
        const newCustomer = new Customer(normalizedCustomer);
        await newCustomer.save();
        results.inserted.push(newCustomer);
      } catch (error) {
        // Handle individual customer errors
        results.errors.push({
          accountNumber: customer.accountNumber || customer.ACCOUNT_NUMBER,
          accountName: customer.accountName || customer.ACCOUNT_NAME,
          branchName: customer.branchName || customer.BRANCH_NAME,
          bankName: customer.bankName || customer.BANK_NAME,
          error: error.message
        });
      }
    }
    
    // Return appropriate response with detailed information
    return res.status(200).json({
      message: 'Import completed with some results',
      summary: {
        total: req.body.length,
        inserted: results.inserted.length,
        duplicates: results.duplicates.length,
        errors: results.errors.length
      },
      inserted: results.inserted,
      duplicates: results.duplicates,
      errors: results.errors,
      // Include the first 10 duplicates for inspection
      duplicatesSample: results.duplicates.slice(0, 10),
      // Include the first 10 errors for inspection
      errorsSample: results.errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ 
      message: 'Server error during bulk import',
      error: err.message
    });
  }
});

// @route   GET /api/customers/branches
// @desc    Get all unique branches with their bank names
// @access  Private
router.get('/branches', protect, async (req, res) => {
  try {
    // Aggregate to get unique combinations of branchName and bankName
    const branches = await Customer.aggregate([
      { 
        $group: { 
          _id: { branchName: "$branchName", bankName: "$bankName" },
          count: { $sum: 1 }
        } 
      },
      {
        $project: {
          _id: 0,
          branchName: "$_id.branchName",
          bankName: "$_id.bankName",
          customerCount: "$count"
        }
      },
      { $sort: { bankName: 1, branchName: 1 } }
    ]);
    
    res.json(branches);
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers
// @desc    Get all customers with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      branchName,
      bankName,
      isRecovered,
      search,
      sortBy = 'dateOfNPA',
      sortOrder = 'desc',
      assignedTo
    } = req.query;

    const query = {};

    // Branch filter (users can only see their assigned customers unless they're admin)
    if (req.user.role !== 'ADMIN') {
      query.assignedTo = req.user.username;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Branch name filter
    if (branchName) {
      query.branchName = branchName;
    }
    
    // Bank name filter
    if (bankName) {
      query.bankName = bankName;
    }

    // Recovery status filter
    if (isRecovered !== undefined) {
      query.isRecovered = isRecovered === 'true';
    }

    // Search filter
    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const customers = await Customer.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCustomers: count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const customer = await Customer.findById(req.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer's branch
    if (req.user.role !== 'ADMIN' && customer.branch !== req.user.branch) {
      return res.status(403).json({ message: 'Not authorized to view this customer' });
    }

    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private (Admin/Officer)
router.put('/:id', protect, authorize('ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'ADMIN' && customer.assignedTo !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json(updatedCustomer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.remove();
    res.json({ message: 'Customer removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/customers/stats/summary
// @desc    Get customer statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const query = req.user.role !== 'ADMIN' ? { branch: req.user.branch } : {};

    const stats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          totalOutstanding: { $sum: '$outstandingBalance' },
          totalRecovered: {
            $sum: {
              $cond: [{ $eq: ['$isRecovered', true] }, '$netBalance', 0]
            }
          },
          recoveredCount: {
            $sum: {
              $cond: [{ $eq: ['$isRecovered', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || {
      totalCustomers: 0,
      totalOutstanding: 0,
      totalRecovered: 0,
      recoveredCount: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/customers/:id/recovery
// @desc    Toggle customer recovery status
// @access  Private (Admin/Officer)
router.put('/:id/recovery', protect, authorize('ADMIN', 'OFFICER'), async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if user has access to this customer
    if (req.user.role !== 'ADMIN' && customer.assignedTo !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to update this customer' });
    }

    // Toggle recovery status
    customer.isRecovered = !customer.isRecovered;
    
    // Set recovery date if marked as recovered
    if (customer.isRecovered) {
      customer.recoveryDate = new Date();
    } else {
      customer.recoveryDate = null;
    }

    await customer.save();

    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
