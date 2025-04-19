export const sampleExcelStructure = [
  {
    srNo: "1",
    branchName: "Main Branch",
    customerId: "C001",
    accountNumber: "191467310000967",
    accountName: "John Doe",
    schemeCode: "PL001",
    productType: "Personal Loan",
    sanctionLimit: "800000",
    dateOfNPA: "2024-01-15",
    outstandingBalance: "711618.08",
    principleOverdue: "650000",
    interestOverdue: "61618.08",
    netBalance: "711618.08",
    provision: "10%",
    anomalies: "None",
    assetClassification: "NPA",
    assetTaggingType: "Type A",
    contactNo: "9876543210",
    communicationAddress: "Sample Address",
    bankName: "Sample Bank",
    assignedTo: "officer1",
    isRecovered: false
  }
];

// Map Excel column names to our internal names
export const columnMapping = {
  'Annexure-I': 'srNo',
  '__EMPTY': 'branchName',
  '__EMPTY_1': 'customerId',
  '__EMPTY_2': 'accountNumber',
  '__EMPTY_3': 'accountName',
  '__EMPTY_4': 'schemeCode',
  '__EMPTY_5': 'productType',
  '__EMPTY_6': 'sanctionLimit',
  '__EMPTY_7': 'dateOfNPA',
  '__EMPTY_8': 'outstandingBalance',
  '__EMPTY_9': 'principleOverdue',
  '__EMPTY_10': 'interestOverdue',
  '__EMPTY_11': 'netBalance',
  '__EMPTY_12': 'provision',
  '__EMPTY_13': 'anomalies',
  '__EMPTY_14': 'assetClassification',
  '__EMPTY_15': 'assetTaggingType',
  '__EMPTY_16': 'contactNo',
  '__EMPTY_17': 'communicationAddress'
};

// Required columns for validation
export const requiredColumns = [
  'Annexure-I',
  '__EMPTY',
  '__EMPTY_1',
  '__EMPTY_2',
  '__EMPTY_3',
  '__EMPTY_4',
  '__EMPTY_5',
  '__EMPTY_6',
  '__EMPTY_7',
  '__EMPTY_8',
  '__EMPTY_9',
  '__EMPTY_10',
  '__EMPTY_11',
  '__EMPTY_12',
  '__EMPTY_13',
  '__EMPTY_14',
  '__EMPTY_15',
  '__EMPTY_16',
  '__EMPTY_17'
];
