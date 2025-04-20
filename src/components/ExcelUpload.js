import React, { useState, useRef, useEffect } from 'react';
import { Button, Box, Typography, CircularProgress, Alert, TextField, MenuItem, FormControl, InputLabel, Select, Grid } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { requiredColumns, columnMapping } from '../utils/sampleData';

const ExcelUpload = ({ onDataUpload, refreshTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [officers, setOfficers] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  
  // Fetch officers from the backend
  const fetchOfficers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only OFFICER role users
        const officersList = data.filter(user => user.role === 'OFFICER');
        console.log('Filtered officers:', officersList);
        setOfficers(officersList);
        
        // If there's no selected officer but we have officers, select the first one
        if (!selectedOfficer && officersList.length > 0) {
          setSelectedOfficer(officersList[0].username);
        }
      } else {
        console.error('Failed to fetch officers, response not OK:', response.status);
      }
    } catch (err) {
      console.error('Failed to fetch officers:', err);
    }
  };
  
  // Fetch officers when component mounts or when refreshTrigger changes
  useEffect(() => {
    fetchOfficers();
  }, [refreshTrigger]); // This will re-run when refreshTrigger changes

  const validateExcelData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Excel file is empty or invalid');
    }

    // Get the first row that's not empty
    const firstDataRow = data.find(row => 
      Object.values(row).some(value => value && value.toString().trim() !== '')
    );

    if (!firstDataRow) {
      throw new Error('No data found in Excel file');
    }

    // Check if all required columns are present
    const missingColumns = requiredColumns.filter(
      col => !(col in firstDataRow)
    );

    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return true;
  };

  const processExcelFile = async (file) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!selectedOfficer) {
      setError('Please select an officer to assign');
      setLoading(false);
      return;
    }
    
    if (!bankName.trim()) {
      setError('Please enter a bank name');
      setLoading(false);
      return;
    }
    
    if (!branchName.trim()) {
      setError('Please enter a branch name');
      setLoading(false);
      return;
    }
    
    try {
      const data = await readExcelFile(file);
      
      // Remove header rows (first row with column names)
      const dataRows = data.filter(row => 
        row['Annexure-I'] && 
        row['Annexure-I'].toString().trim() !== 'Sr No.' &&
        !isNaN(row['Annexure-I'])
      );
      
      validateExcelData(dataRows);
      
      // Transform data to match our internal format
      const transformedData = dataRows.map(row => {
        const transformedRow = {};
        Object.entries(columnMapping).forEach(([excelCol, internalCol]) => {
          transformedRow[internalCol] = row[excelCol]?.toString() || '';
        });
        
        // Add the officer, bank name, and branch name
        transformedRow.assignedTo = selectedOfficer;
        transformedRow.bankName = bankName;
        transformedRow.branchName = branchName;
        transformedRow.isRecovered = false;
        
        // Ensure we're using the correct field names
        if ('ACCOUNT_NUMBER' in transformedRow) {
          transformedRow.accountNumber = transformedRow.ACCOUNT_NUMBER;
          delete transformedRow.ACCOUNT_NUMBER;
        }
        
        if ('OUTSTANDING_BALANCE' in transformedRow) {
          transformedRow.outstandingBalance = transformedRow.OUTSTANDING_BALANCE;
          delete transformedRow.OUTSTANDING_BALANCE;
        }
        
        if ('PRINCIPLE_OVERDUE' in transformedRow) {
          transformedRow.principleOverdue = transformedRow.PRINCIPLE_OVERDUE;
          delete transformedRow.PRINCIPLE_OVERDUE;
        }
        
        if ('INTEREST_OVERDUE' in transformedRow) {
          transformedRow.interestOverdue = transformedRow.INTEREST_OVERDUE;
          delete transformedRow.INTEREST_OVERDUE;
        }
        
        return transformedRow;
      });

      // Upload to the backend
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transformedData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.summary) {
          // New response format with detailed summary
          setSuccess(`Import completed: ${result.summary.inserted} customers inserted successfully`);
          
          if (result.summary.duplicates > 0) {
            setError(`${result.summary.duplicates} duplicates were skipped`);
            
            // Log duplicate details to console for inspection
            if (result.duplicatesSample && result.duplicatesSample.length > 0) {
              console.log('Duplicate samples:', result.duplicatesSample);
              
              // Create a detailed message for the first few duplicates
              const duplicateDetails = result.duplicatesSample.slice(0, 3).map(dup => {
                return `Account: ${dup.accountNumber}, Bank: ${dup.bankName}, Branch: ${dup.branchName}`;
              }).join('\n');
              
              // Add duplicate details to the UI
              setError(prev => `${prev}\n\nSample duplicates:\n${duplicateDetails}\n\nCheck browser console for more details.`);
            }
          }
          
          if (result.summary.errors > 0) {
            setError((prev) => `${prev ? prev + '\n\n' : ''}${result.summary.errors} errors occurred`);
            
            // Log error details to console for inspection
            if (result.errorsSample && result.errorsSample.length > 0) {
              console.log('Error samples:', result.errorsSample);
            }
          }
        } else {
          // Old response format
          setSuccess(`Successfully uploaded ${result.length || 'all'} customers and assigned to the selected officer`);
        }
        onDataUpload(transformedData);
        
        // Set a short timeout before reloading the page to allow the success message to be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to upload customers');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError(error.message);
    }
    setLoading(false);
  };

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false,
            defval: '' // Set default value for empty cells
          });
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      
      reader.onerror = (error) => {
        reject(new Error('Failed to read file: ' + error.message));
      };

      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      if (!file.name.toLowerCase().match(/\.(xlsx|xls)$/i)) {
        setError('Please upload only Excel files (.xlsx or .xls)');
        return;
      }
      processExcelFile(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const downloadSampleFile = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Create headers row using required columns
      const sampleData = [
        {
          'Annexure-I': 'Sr No.',
          '__EMPTY': 'Branch Name',
          '__EMPTY_1': 'Cust Id',
          '__EMPTY_2': 'A/c Number',
          '__EMPTY_3': 'A/c Name',
          '__EMPTY_4': 'Scheme Code',
          '__EMPTY_5': 'Product Type',
          '__EMPTY_6': 'Sanction Limit',
          '__EMPTY_7': 'Date of NPA',
          '__EMPTY_8': 'O/s Bal.',
          '__EMPTY_9': 'Principle Overdue',
          '__EMPTY_10': 'Interest Overdue',
          '__EMPTY_11': 'Net Balance',
          '__EMPTY_12': 'Provision',
          '__EMPTY_13': 'Anomalies',
          '__EMPTY_14': 'Asset Classification',
          '__EMPTY_15': 'Asset Tagging Type',
          '__EMPTY_16': 'Contact No.',
          '__EMPTY_17': 'Communication Address'
        },
        {
          'Annexure-I': '1',
          '__EMPTY': 'Main Branch',
          '__EMPTY_1': 'C001',
          '__EMPTY_2': '191467310000967',
          '__EMPTY_3': 'John Doe',
          '__EMPTY_4': 'PL001',
          '__EMPTY_5': 'Personal Loan',
          '__EMPTY_6': '800000',
          '__EMPTY_7': '2024-01-15',
          '__EMPTY_8': '711618.08',
          '__EMPTY_9': '650000',
          '__EMPTY_10': '61618.08',
          '__EMPTY_11': '711618.08',
          '__EMPTY_12': '10%',
          '__EMPTY_13': 'None',
          '__EMPTY_14': 'NPA',
          '__EMPTY_15': 'Type A',
          '__EMPTY_16': '9876543210',
          '__EMPTY_17': 'Sample Address'
        }
      ];
      
      // Create a worksheet with sample data
      const ws = XLSX.utils.json_to_sheet(sampleData, { skipHeader: true });
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      // Save the file
      XLSX.writeFile(wb, 'debt_recovery_template.xlsx');
    } catch (error) {
      console.error('Error creating template:', error);
      setError('Failed to download template: ' + error.message);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <input
        ref={fileInputRef}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        id="excel-upload"
        type="file"
        onChange={handleFileUpload}
      />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Officer Selection */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="officer-select-label">Assign to Officer</InputLabel>
            <Select
              labelId="officer-select-label"
              value={selectedOfficer}
              label="Assign to Officer"
              onChange={(e) => setSelectedOfficer(e.target.value)}
              disabled={loading}
            >
              {officers.map((officer) => (
                <MenuItem key={officer._id} value={officer.username}>
                  {officer.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        {/* Bank Name */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Bank Name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            disabled={loading}
          />
        </Grid>
        
        {/* Branch Name */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            disabled={loading}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleButtonClick}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          disabled={loading}
        >
          Upload Excel
        </Button>
        <Button
          variant="outlined"
          onClick={downloadSampleFile}
          disabled={loading}
        >
          Download Template
        </Button>
      </Box>
      
      {loading && (
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Processing file...
        </Typography>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default ExcelUpload;
