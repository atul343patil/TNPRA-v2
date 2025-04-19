import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  TablePagination,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRecovery } from '../context/RecoveryContext';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    customer: null,
    action: '' // 'recover' or 'undo'
  });
  const { recoveredLoans, addRecoveredLoan, removeRecoveredLoan, updateTotalStats } = useRecovery();

  useEffect(() => {
    const savedData = localStorage.getItem('excelData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setCustomers(parsedData);
      updateTotalStats(parsedData);
    }
  }, [updateTotalStats]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRecoveryToggle = (customer) => {
    const isRecovered = recoveredLoans.some(loan => loan.SR_NO === customer.SR_NO);
    
    if (isRecovered) {
      // Open confirmation dialog for undoing recovery
      setConfirmDialog({
        open: true,
        customer,
        action: 'undo'
      });
    } else {
      // Open confirmation dialog for marking as recovered
      setConfirmDialog({
        open: true,
        customer,
        action: 'recover'
      });
    }
  };

  const handleConfirmRecovery = () => {
    const { customer, action } = confirmDialog;
    
    if (action === 'recover') {
      // Add recovery date and additional info
      const recoveredCustomer = {
        ...customer,
        recoveryDate: new Date().toISOString(),
        recoveryInfo: {
          recoveredBy: localStorage.getItem('userName') || 'Admin',
          notes: ''
        }
      };
      addRecoveredLoan(recoveredCustomer);
    } else if (action === 'undo') {
      removeRecoveredLoan(customer.SR_NO);
    }
    
    // Close the dialog
    setConfirmDialog({
      open: false,
      customer: null,
      action: ''
    });
  };

  const handleCloseDialog = () => {
    setConfirmDialog({
      open: false,
      customer: null,
      action: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Customer List
        </Typography>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table sx={{ minWidth: 750 }} aria-label="customer table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Typography variant="subtitle2">Recovered</Typography>
                  </TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Account No.</TableCell>
                  <TableCell>Branch</TableCell>
                  <TableCell>Product Type</TableCell>
                  <TableCell>Outstanding</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contact</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((customer) => {
                    const isRecovered = recoveredLoans.some(
                      loan => loan.SR_NO === customer.SR_NO
                    );

                    return (
                      <TableRow
                        hover
                        key={customer.SR_NO}
                        sx={{
                          backgroundColor: isRecovered ? 'action.hover' : 'inherit'
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isRecovered}
                            onChange={() => handleRecoveryToggle(customer)}
                          />
                        </TableCell>
                        <TableCell>{customer.CUSTOMER_NAME}</TableCell>
                        <TableCell>{customer.ACC_NO}</TableCell>
                        <TableCell>{customer.BRANCH}</TableCell>
                        <TableCell>{customer.PRODUCT_TYPE}</TableCell>
                        <TableCell>
                          {formatCurrency(customer.NET_BALANCE)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.ASSET_CLASSIFICATION}
                            color={customer.ASSET_CLASSIFICATION === 'NPA' ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{customer.CONTACT_NO}</TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={customers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseDialog}
        aria-labelledby="recovery-confirmation-dialog"
      >
        <DialogTitle id="recovery-confirmation-dialog">
          {confirmDialog.action === 'recover' 
            ? 'Confirm Recovery' 
            : 'Undo Recovery'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'recover' 
              ? `Are you sure you want to mark ${confirmDialog.customer?.CUSTOMER_NAME}'s account (${confirmDialog.customer?.ACC_NO}) as recovered? This will be recorded in the reports.` 
              : `Are you sure you want to undo the recovery status for ${confirmDialog.customer?.CUSTOMER_NAME}'s account (${confirmDialog.customer?.ACC_NO})?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmRecovery} color="primary" variant="contained" autoFocus>
            {confirmDialog.action === 'recover' ? 'Yes, Mark as Recovered' : 'Yes, Undo Recovery'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default CustomerList;
