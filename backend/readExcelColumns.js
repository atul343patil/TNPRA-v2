const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the Excel file
const excelFilePath = path.join(__dirname, '..', 'Paith SAJAG.XLSX');

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelFilePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Get the header row (first row)
  const headers = data[0];
  
  console.log('Excel Column Names:');
  console.log(headers);
  
  // Print a sample row to understand the data structure
  if (data.length > 1) {
    console.log('\nSample Data Row:');
    console.log(data[1]);
  }
  
} catch (error) {
  console.error('Error reading Excel file:', error);
}
