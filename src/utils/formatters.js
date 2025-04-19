/**
 * Utility functions for formatting data in the application
 */

/**
 * Formats a phone number by removing the country code (91) if present
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If the number starts with 91 and is longer than 10 digits, remove the 91
  if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
    return digitsOnly.substring(2);
  }
  
  return digitsOnly;
};

/**
 * Formats currency values in Indian Rupee format
 * @param {number|string} amount - The amount to format
 * @returns {string} - The formatted currency string
 */
export const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
