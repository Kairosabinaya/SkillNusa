import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  UsersIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  StarIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const dashboardStats = await adminService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      setError(err.message);
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" text="Memuat dashboard admin..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadDashboardStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      description: `${stats?.totalFreelancers || 0} Freelancer, ${stats?.totalClients || 0} Client`
    },
    {
      title: 'Total Gigs',
      value: stats?.totalGigs || 0,
      icon: BriefcaseIcon,
      color: 'bg-green-500',
      description: `${stats?.activeGigs || 0} Aktif, ${stats?.inactiveGigs || 0} Tidak Aktif`
    },
    {
      title: 'Total Pesanan',
      value: stats?.totalOrders || 0,
      icon: ShoppingCartIcon,
      color: 'bg-yellow-500',
      description: 'Semua pesanan yang pernah dibuat'
    },
    {
      title: 'Total Review',
      value: stats?.totalReviews || 0,
      icon: StarIcon,
      color: 'bg-purple-500',
      description: 'Ulasan dari client'
    }
  ];

  const quickActions = [
    {
      title: 'Kelola Pengguna',
      description: 'Lihat dan kelola semua akun pengguna',
      icon: UserGroupIcon,
      color: 'bg-blue-100 text-blue-600',
      href: '/dashboard/admin/users'
    },
    {
      title: 'Kelola Gigs',
      description: 'Lihat dan kelola semua gig yang terdaftar',
      icon: DocumentTextIcon,
      color: 'bg-green-100 text-green-600',
      href: '/dashboard/admin/gigs'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">
            Selamat datang, {userProfile?.displayName || userProfile?.username}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">{stat.description}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-full ${action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-gray-600">{action.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terbaru</h2>
          <div className="text-center py-8 text-gray-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Fitur aktivitas terbaru akan segera hadir</p>
          </div>
        </div>
      </div>
    </div>
  );
} 