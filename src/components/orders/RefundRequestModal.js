import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import BankAccountManager from '../Profile/BankAccountManager';

const RefundRequestModal = ({ isOpen, onClose, order }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Reason, 2: Bank Account, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const refundReasons = [
    'Freelancer tidak merespons dalam waktu yang ditentukan',
    'Freelancer menolak pekerjaan',
    'Kualitas pekerjaan tidak sesuai ekspektasi',
    'Freelancer tidak dapat menyelesaikan pekerjaan',
    'Perubahan kebutuhan proyek',
    'Lainnya'
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedBankAccount(null);
      setRefundReason('');
      setCustomReason('');
    }
  }, [isOpen]);

  const handleReasonNext = () => {
    if (!refundReason) {
      toast.error('Please select a reason for refund');
      return;
    }
    
    if (refundReason === 'Lainnya' && !customReason.trim()) {
      toast.error('Please provide a custom reason');
      return;
    }
    
    setStep(2);
  };

  const handleBankAccountNext = () => {
    if (!selectedBankAccount) {
      toast.error('Please select a bank account for refund');
      return;
    }
    
    setStep(3);
  };

  const handleSubmitRefund = async () => {
    try {
      setLoading(true);
      
      const finalReason = refundReason === 'Lainnya' ? customReason : refundReason;
      
      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          reason: finalReason,
          refundType: 'manual',
          requestedBy: user.uid,
          bankAccountId: selectedBankAccount.id
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Refund request submitted successfully!');
        onClose();
        // Optionally refresh the order data
        window.location.reload();
      } else {
        toast.error(data.message || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error submitting refund:', error);
      toast.error('Error submitting refund request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Refund</h2>
            <p className="text-sm text-gray-500 mt-1">
              Order #{order?.merchantRef || order?.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Reason</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Bank Account</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Confirm</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Reason */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Why do you want to request a refund?
                </h3>
                <div className="space-y-3">
                  {refundReasons.map((reason) => (
                    <label key={reason} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="refundReason"
                        value={reason}
                        checked={refundReason === reason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>

                {refundReason === 'Lainnya' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please specify your reason:
                    </label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Enter your custom reason..."
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Information
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Refund requests will be reviewed by our admin team</li>
                        <li>Processing time: 3-7 business days</li>
                        <li>Refund amount: Rp {(order?.totalAmount || order?.price || 0).toLocaleString('id-ID')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Bank Account */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Select Bank Account for Refund
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose the bank account where you want to receive your refund.
                </p>
              </div>

              <BankAccountManager
                showSelector={true}
                onAccountSelect={setSelectedBankAccount}
                selectedAccountId={selectedBankAccount?.id}
              />

              {selectedBankAccount && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Bank Account Selected
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{selectedBankAccount.bankName} - {selectedBankAccount.accountHolderName}</p>
                        <p>Account: ****{selectedBankAccount.accountNumber.slice(-4)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Confirm Refund Request
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Please review your refund request details before submitting.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order ID</p>
                    <p className="text-sm text-gray-900">{order?.merchantRef || order?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Refund Amount</p>
                    <p className="text-sm text-gray-900 font-semibold">
                      Rp {(order?.totalAmount || order?.price || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Reason</p>
                  <p className="text-sm text-gray-900">
                    {refundReason === 'Lainnya' ? customReason : refundReason}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Refund to Bank Account</p>
                  <div className="text-sm text-gray-900">
                    <p>{selectedBankAccount?.bankName} - {selectedBankAccount?.accountHolderName}</p>
                    <p>Account: ****{selectedBankAccount?.accountNumber.slice(-4)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      What happens next?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Your refund request will be reviewed by our admin team</li>
                        <li>You'll receive an email notification about the status</li>
                        <li>If approved, refund will be processed to your selected bank account</li>
                        <li>Processing time: 3-7 business days</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {step < 3 ? (
              <button
                onClick={step === 1 ? handleReasonNext : handleBankAccountNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitRefund}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundRequestModal; 