import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import ErrorPopup from '../../components/common/ErrorPopup';
import SuccessPopup from '../../components/common/SuccessPopup';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  orderBy,
  limit,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export default function FreelancerWallet() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wallet, setWallet] = useState({
    balance: 0,          // Saldo Tersedia - semua pendapatan yang bisa ditarik
    pendingBalance: 0,   // Saldo Pending - yang sedang diproses/belum direlease
    totalEarnings: 0     // Total Pendapatan sepanjang masa
  });
  const [transactions, setTransactions] = useState([]);
  const [withdrawalMethods, setWithdrawalMethods] = useState([]);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: '',
    accountNumber: '',
    accountName: '',
    notes: ''
  });

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
    fetchWithdrawalMethods();
  }, [currentUser]);

  const fetchWalletData = async () => {
    if (!currentUser) return;

    try {
      // Fetch completed orders to calculate earnings
      const ordersQuery = query(
        collection(db, 'orders'),
        where('freelancerId', '==', currentUser.uid),
        where('status', '==', 'completed')
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      let totalEarnings = 0;
      let availableBalance = 0;

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        // Use freelancerEarning field instead of amount with platform fee calculation
        const earnings = order.freelancerEarning || (order.price ? order.price * 0.85 : 0) || (order.totalAmount ? order.totalAmount * 0.85 : 0);
        totalEarnings += earnings;
        availableBalance += earnings; // Dana langsung tersedia setelah order completed
      });

      // Fetch pending balance from orders in review
      const pendingQuery = query(
        collection(db, 'orders'),
        where('freelancerId', '==', currentUser.uid),
        where('status', 'in', ['delivered', 'in_revision'])
      );

      const pendingSnapshot = await getDocs(pendingQuery);
      let pendingBalance = 0;

      pendingSnapshot.forEach(doc => {
        const order = doc.data();
        // Use freelancerEarning field instead of amount
        const earnings = order.freelancerEarning || (order.price ? order.price * 0.85 : 0) || (order.totalAmount ? order.totalAmount * 0.85 : 0);
        pendingBalance += earnings;
      });

      // Subtract withdrawn amounts
      const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('userId', '==', currentUser.uid),
        where('status', 'in', ['completed', 'pending'])
      );

      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      let withdrawnAmount = 0;
      let pendingWithdrawal = 0;

      withdrawalsSnapshot.forEach(doc => {
        const withdrawal = doc.data();
        if (withdrawal.status === 'completed') {
          withdrawnAmount += withdrawal.amount;
        } else if (withdrawal.status === 'pending') {
          pendingWithdrawal += withdrawal.amount;
        }
      });

      setWallet({
        balance: availableBalance - withdrawnAmount - pendingWithdrawal, // Saldo yang bisa ditarik
        pendingBalance: pendingBalance + pendingWithdrawal, // Termasuk penarikan yang sedang diproses
        totalEarnings: totalEarnings,
      });

    } catch (error) {
      // Silent error handling
    }
  };

  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      // Fetch earnings from orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('freelancerId', '==', currentUser.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(20)
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const earnings = [];

      ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const amount = order.freelancerEarning || (order.price ? order.price * 0.85 : 0) || (order.totalAmount ? order.totalAmount * 0.85 : 0) || 0;
        earnings.push({
          id: doc.id,
          type: 'earning',
          amount: amount,
          description: `Pembayaran untuk: ${order.title || order.gigTitle || 'Gig'}`,
          date: order.completedAt?.toDate(),
          status: 'completed',
          orderId: doc.id
        });
      });

      // Fetch withdrawals
      const withdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const withdrawalsSnapshot = await getDocs(withdrawalsQuery);
      const withdrawals = [];

      withdrawalsSnapshot.forEach(doc => {
        const withdrawal = doc.data();
        withdrawals.push({
          id: doc.id,
          type: 'withdrawal',
          amount: -withdrawal.amount,
          description: `Penarikan ke ${withdrawal.method}`,
          date: withdrawal.createdAt?.toDate(),
          status: withdrawal.status,
          accountNumber: withdrawal.accountNumber
        });
      });

      // Combine and sort all transactions
      const allTransactions = [...earnings, ...withdrawals]
        .sort((a, b) => (b.date || new Date()) - (a.date || new Date()));

      setTransactions(allTransactions);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalMethods = () => {
    // In production, this would be fetched from config or user preferences
    setWithdrawalMethods([
      { id: 'bank_bca', name: 'Bank BCA', fee: 0, icon: '🏦' },
      { id: 'bank_mandiri', name: 'Bank Mandiri', fee: 0, icon: '🏦' },
      { id: 'bank_bni', name: 'Bank BNI', fee: 0, icon: '🏦' },
      { id: 'bank_bri', name: 'Bank BRI', fee: 0, icon: '🏦' },
      { id: 'gopay', name: 'GoPay', fee: 2500, icon: '📱' },
      { id: 'ovo', name: 'OVO', fee: 2500, icon: '📱' },
      { id: 'dana', name: 'DANA', fee: 2500, icon: '📱' }
    ]);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawForm.amount || !withdrawForm.method) {
      setError('Jumlah penarikan dan metode harus diisi');
      return;
    }

    const amount = parseFloat(withdrawForm.amount);
    
    if (amount > wallet.balance || amount < 50000) {
      setError(`Jumlah penarikan tidak valid. Minimum Rp 50.000, maksimal ${formatCurrency(wallet.balance)}`);
      return;
    }

    setWithdrawing(true);
    try {
      const selectedMethod = withdrawalMethods.find(m => m.id === withdrawForm.method);
      
      await addDoc(collection(db, 'withdrawals'), {
        userId: currentUser.uid,
        amount: amount,
        method: selectedMethod.name,
        methodId: withdrawForm.method,
        accountNumber: withdrawForm.accountNumber,
        accountName: withdrawForm.accountName,
        notes: withdrawForm.notes,
        fee: selectedMethod.fee,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Send notification to admin
      await addDoc(collection(db, 'notifications'), {
        type: 'withdrawal_request',
        message: `Permintaan penarikan ${formatCurrency(amount)} dari ${currentUser.displayName}`,
        userId: 'admin',
        withdrawalAmount: amount,
        createdAt: serverTimestamp(),
        read: false
      });

      setShowWithdrawModal(false);
      setWithdrawForm({
        amount: '',
        method: '',
        accountNumber: '',
        accountName: '',
        notes: ''
      });
      
      fetchWalletData();
      fetchTransactions();
      
      setSuccess('Permintaan penarikan berhasil diajukan');
    } catch (error) {
      setError('Gagal mengajukan penarikan');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type, status) => {
    if (type === 'earning') {
      return <ArrowDownIcon className="h-5 w-5 text-green-600" />;
    } else if (type === 'withdrawal') {
      if (status === 'completed') {
        return <ArrowUpIcon className="h-5 w-5 text-red-600" />;
      } else if (status === 'pending') {
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      } else {
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      }
    }
    return <DocumentTextIcon className="h-5 w-5 text-gray-600" />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Selesai</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Menunggu</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Gagal</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ErrorPopup 
        message={error} 
        onClose={() => setError('')} 
        duration={3000}
      />
      
      <SuccessPopup 
        message={success} 
        onClose={() => setSuccess('')} 
        duration={3000}
      />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Wallet & Pendapatan
        </h1>
        <p className="text-gray-600">
          Kelola pendapatan dan penarikan dana Anda
        </p>
      </motion.div>

      {/* Balance Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8"
      >
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(wallet.balance)}
          </h3>
          <p className="text-sm text-gray-600">Saldo Tersedia</p>
          <p className="text-xs text-gray-500 mt-1">Siap ditarik</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(wallet.pendingBalance)}
          </h3>
          <p className="text-sm text-gray-600">Saldo Pending</p>
          <p className="text-xs text-gray-500 mt-1">Order & penarikan diproses</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <BanknotesIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(wallet.totalEarnings)}
          </h3>
          <p className="text-sm text-gray-600">Total Pendapatan</p>
          <p className="text-xs text-orange-600 mt-1 font-medium">
            Sudah dipotong platform fee 10%
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Aksi Cepat
          </h2>
          
          {/* Quick Action Button */}
          <div className="/5 rounded-lg p-4 mb-6">
            <button 
              onClick={() => setShowWithdrawModal(true)}
              disabled={wallet.balance < 50000}
              className="w-full flex items-center justify-center gap-2 bg-[#4A72FF] text-white py-3 px-4 rounded-lg hover:bg-[#3355CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUpIcon className="h-5 w-5" />
              Tarik Dana
            </button>
          </div>

          {/* Withdrawal Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span className="text-sm font-medium text-gray-700">Informasi Penarikan</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Minimum penarikan:</span>
                  <span className="text-sm font-medium text-gray-900">Rp 50,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Waktu proses:</span>
                  <span className="text-sm font-medium text-gray-900">1-3 hari kerja</span>
                </div>

              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg">
                <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500">
                  Dana akan diproses dalam 1-3 hari kerja setelah permintaan penarikan
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Riwayat Transaksi
          </h2>
          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-4">
                      {getTransactionIcon(transaction.type, transaction.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)}
                      </p>
                      {transaction.accountNumber && (
                        <p className="text-xs text-gray-500">
                          ****{transaction.accountNumber.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Tarik Dana
              </h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah Penarikan
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    min="50000"
                                          className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimal: {formatCurrency(wallet.balance)}
                  </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metode Penarikan
                </label>
                <select
                  value={withdrawForm.method}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  required
                >
                  <option value="">Pilih metode</option>
                  {withdrawalMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.icon} {method.name} {method.fee > 0 && `(Fee: ${formatCurrency(method.fee)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Rekening/Akun
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountNumber}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Pemilik Akun
                </label>
                <input
                  type="text"
                  value={withdrawForm.accountName}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="Nama sesuai rekening"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={withdrawForm.notes}
                  onChange={(e) => setWithdrawForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Catatan tambahan..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="flex-1 px-4 py-2 bg-[#010042] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawing ? 'Memproses...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
} 