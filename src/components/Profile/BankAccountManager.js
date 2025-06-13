import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const BankAccountManager = ({ onAccountSelect, selectedAccountId, showSelector = false }) => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    isPrimary: false
  });

  // List of Indonesian banks
  const indonesianBanks = [
    'BCA', 'BRI', 'BNI', 'MANDIRI', 'CIMB NIAGA', 'DANAMON', 'PERMATA',
    'MAYBANK', 'PANIN', 'OCBC NISP', 'BTN', 'MEGA', 'BUKOPIN', 'SINARMAS',
    'COMMONWEALTH', 'HSBC', 'STANDARD CHARTERED', 'CITIBANK', 'JENIUS',
    'DIGIBANK', 'TMRW', 'SEABANK', 'NEO COMMERCE', 'JAGO', 'ALLO BANK'
  ];

  useEffect(() => {
    if (user?.uid) {
      fetchBankAccounts();
    }
  }, [user]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bank-account?userId=${user.uid}`);
      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.bankAccounts);
      } else {
        toast.error('Failed to fetch bank accounts');
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Error loading bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.accountNumber || !formData.accountHolderName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const url = editingAccount ? '/api/bank-account' : '/api/bank-account';
      const method = editingAccount ? 'PUT' : 'POST';
      
      const payload = {
        userId: user.uid,
        ...formData,
        ...(editingAccount && { bankAccountId: editingAccount.id })
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingAccount ? 'Bank account updated!' : 'Bank account added!');
        setShowForm(false);
        setEditingAccount(null);
        setFormData({
          bankName: '',
          accountNumber: '',
          accountHolderName: '',
          isPrimary: false
        });
        fetchBankAccounts();
      } else {
        toast.error(data.message || 'Failed to save bank account');
      }
    } catch (error) {
      console.error('Error saving bank account:', error);
      toast.error('Error saving bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolderName: account.accountHolderName,
      isPrimary: account.isPrimary
    });
    setShowForm(true);
  };

  const handleDelete = async (accountId) => {
    if (!confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/bank-account?bankAccountId=${accountId}&userId=${user.uid}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Bank account deleted!');
        fetchBankAccounts();
      } else {
        toast.error(data.message || 'Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Error deleting bank account');
    } finally {
      setLoading(false);
    }
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    const visible = accountNumber.slice(-4);
    const masked = '*'.repeat(Math.max(0, accountNumber.length - 4));
    return masked + visible;
  };

  if (showSelector) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Bank Account for Refund</h3>
        
        {bankAccounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">No bank accounts found</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Bank Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedAccountId === account.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onAccountSelect?.(account)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.bankName}</p>
                      <p className="text-sm text-gray-500">{maskAccountNumber(account.accountNumber)}</p>
                      <p className="text-sm text-gray-500">{account.accountHolderName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.isPrimary && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Primary
                      </span>
                    )}
                    {selectedAccountId === account.id && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add New Bank Account
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Bank Accounts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Bank Account
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {/* Bank Accounts List */}
      {bankAccounts.length === 0 && !loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-gray-500">No bank accounts added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bankAccounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{account.bankName}</p>
                      {account.isPrimary && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Primary
                        </span>
                      )}
                      {!account.isVerified && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{maskAccountNumber(account.accountNumber)}</p>
                    <p className="text-sm text-gray-500">{account.accountHolderName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingAccount(null);
                  setFormData({
                    bankName: '',
                    accountNumber: '',
                    accountHolderName: '',
                    isPrimary: false
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Bank</option>
                  {indonesianBanks.map((bank) => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="Enter account number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value.toUpperCase() })}
                  placeholder="Enter account holder name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700">
                  Set as primary account
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAccount(null);
                    setFormData({
                      bankName: '',
                      accountNumber: '',
                      accountHolderName: '',
                      isPrimary: false
                    });
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingAccount ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountManager; 