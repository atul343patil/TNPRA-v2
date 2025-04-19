const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Sr No. from Excel
  srNo: {
    type: String
  },
  // Branch Name from Excel
  branchName: {
    type: String
  },
  // Cust Id from Excel
  customerId: {
    type: String
  },
  // A/c Number from Excel - This is unique
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  // A/c Name from Excel
  accountName: {
    type: String
  },
  // Scheme Code from Excel
  schemeCode: {
    type: String
  },
  // Product Type from Excel
  productType: {
    type: String
  },
  // Sanction Limit from Excel
  sanctionLimit: {
    type: String
  },
  // Date of NPA from Excel
  dateOfNPA: {
    type: String
  },
  // O/s Bal. from Excel
  outstandingBalance: {
    type: String
  },
  // Principle Overdue from Excel
  principleOverdue: {
    type: String
  },
  // Interest Overdue from Excel
  interestOverdue: {
    type: String
  },
  // Net Balance from Excel
  netBalance: {
    type: String
  },
  // Provision from Excel
  provision: {
    type: String
  },
  // Anomalies from Excel
  anomalies: {
    type: String,
    default: 'None'
  },
  // Asset Classification from Excel
  assetClassification: {
    type: String
  },
  // Asset Tagging Type from Excel
  assetTaggingType: {
    type: String
  },
  // Contact No. from Excel
  contactNo: {
    type: String
  },
  // Communication Address from Excel
  communicationAddress: {
    type: String
  },
  // Bank name (added from UI)
  bankName: {
    type: String,
    default: 'Default Bank'
  },
  isRecovered: {
    type: Boolean,
    default: false
  },
  recoveryDate: {
    type: Date
  },
  assignedTo: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
customerSchema.index({ branchName: 1, isRecovered: 1 });
customerSchema.index({ assetClassification: 1 });
customerSchema.index({ dateOfNPA: 1 });
customerSchema.index({ accountNumber: 1 }, { unique: true, sparse: true });
customerSchema.index({ assignedTo: 1 });

// Remove any existing indexes that might cause problems
mongoose.connection.collections['customers']?.dropIndexes()
  .catch(err => {
    // Ignore if collection doesn't exist
    console.log('Note: Dropping indexes - this is expected on first run');
  });

module.exports = mongoose.model('Customer', customerSchema);
