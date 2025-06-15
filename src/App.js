import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavigationRoleHandler from './components/NavigationRoleHandler';
import { AuthProvider } from './context/AuthContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import subscriptionMonitor from './utils/subscriptionMonitor';
import { ROUTES } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

// Debug utilities (available in console as window.debugFirestore)


// Firebase read monitoring (available in console)


// Import Firebase usage debugging utility for development


// Import test scripts for debugging
import './scripts/testNotifications';


// Layouts
import PublicLayout from './components/Layout/PublicLayout';
import DashboardLayoutWrapper from './components/Layout/DashboardLayoutWrapper';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';
import AuthAction from './pages/Auth/AuthAction';

// Profile Pages
import Profile from './pages/Profile/Profile';
import EditProfile from './pages/Profile/EditProfile';
import BecomeFreelancer from './pages/Profile/BecomeFreelancer';

// Gig Pages
import GigDetail from './pages/GigDetail';
import Browse from './pages/Browse';

// Client Pages
import Favorites from './pages/Favorites';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

import Messages from './pages/Messages';

// Dashboard Pages
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import ClientTransactions from './pages/Dashboard/ClientTransactions';
import ClientCart from './pages/Dashboard/ClientCart';
import ClientFavorites from './pages/Dashboard/ClientFavorites';
import ClientMessages from './pages/Dashboard/ClientMessages';

// Test Pages

import SeedingPage from './pages/SeedingPage';
import AdminCleanup from './pages/AdminCleanup';
import FreelancerProfile from './pages/FreelancerProfile';

// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardRedirect from './components/DashboardRedirect';

// Freelancer Pages
import FreelancerDashboard from './pages/Dashboard/FreelancerDashboard';
import FreelancerGuides from './pages/Dashboard/FreelancerGuides';
import FreelancerChat from './pages/Dashboard/FreelancerChat';
import FreelancerGigs from './pages/Dashboard/FreelancerGigs';
import CreateGig from './pages/Dashboard/CreateGig';
import FreelancerOrders from './pages/Dashboard/FreelancerOrders';
import FreelancerAnalytics from './pages/Dashboard/FreelancerAnalytics';
import FreelancerWallet from './pages/Dashboard/FreelancerWallet';
import FreelancerNotifications from './pages/Dashboard/FreelancerNotifications';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import AdminUsers from './pages/Dashboard/AdminUsers';
import AdminGigs from './pages/Dashboard/AdminGigs';

function App() {
  // Start subscription health monitoring in development
  if (process.env.NODE_ENV === 'development') {
    subscriptionMonitor.startHealthCheck();
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <Router>
            <NavigationRoleHandler>
            <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path={ROUTES.ABOUT.slice(1)} element={<About />} />
            <Route path={ROUTES.CONTACT.slice(1)} element={<Contact />} />
            <Route path="browse" element={<Browse />} />
          </Route>

          {/* Gig Routes */}
          <Route path="/gig/:gigId" element={<PublicLayout />}>
            <Route index element={<GigDetail />} />
          </Route>

          {/* Freelancer Profile Route */}
          <Route path="/freelancer/:freelancerId" element={<PublicLayout />}>
            <Route index element={<FreelancerProfile />} />
          </Route>

          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['client', 'freelancer', 'admin']}>
                  <DashboardLayoutWrapper />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            {/* Dashboard root redirect */}
            <Route 
              index 
              element={
                <DashboardRedirect />
              } 
            />
            
            {/* Client Dashboard Routes */}
            <Route 
              path="client" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientDashboard />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/transactions" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientTransactions />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/transactions/:transactionId" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientTransactions />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/cart" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientCart />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/favorites" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientFavorites />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/messages" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientMessages />
                </RoleRoute>
              } 
            />
            <Route 
              path="client/messages/:chatId" 
              element={
                <RoleRoute allowedRoles="client">
                  <ClientMessages />
                </RoleRoute>
              } 
            />
            
            {/* Freelancer Dashboard Routes */}
            <Route 
              path="freelancer" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerDashboard />
                </RoleRoute>
              } 
            />
            {/* Route untuk profile sudah diintegrasikan ke dalam FreelancerDashboard */}
            <Route 
              path="freelancer/guides" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerGuides />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/chat" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerChat />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/gigs" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerGigs />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/gigs/create" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <CreateGig />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/gigs/edit/:gigId" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <CreateGig />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/orders" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerOrders />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/orders/:orderId" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerOrders />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/notifications" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerNotifications />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/analytics" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerAnalytics />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/wallet" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <FreelancerWallet />
                </RoleRoute>
              } 
            />

            <Route 
              path="freelancer/messages" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <Messages />
                </RoleRoute>
              } 
            />
            <Route 
              path="freelancer/messages/:chatId" 
              element={
                <RoleRoute allowedRoles="freelancer">
                  <Messages />
                </RoleRoute>
              } 
            />
            
            {/* TODO: Add Admin Dashboard Routes */}
            
            {/* Admin Dashboard Routes */}
            <Route 
              path="admin" 
              element={
                <RoleRoute allowedRoles="admin">
                  <AdminDashboard />
                </RoleRoute>
              } 
            />
            <Route 
              path="admin/users" 
              element={
                <RoleRoute allowedRoles="admin">
                  <AdminUsers />
                </RoleRoute>
              } 
            />
            <Route 
              path="admin/gigs" 
              element={
                <RoleRoute allowedRoles="admin">
                  <AdminGigs />
                </RoleRoute>
              } 
            />
          </Route>



          {/* Legacy Client Feature Routes (for backward compatibility) */}
          <Route 
            path="/favorites" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Favorites />} />
          </Route>

          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Cart />} />
          </Route>

          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Checkout />} />
          </Route>



          <Route 
            path="/messages" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Messages />} />
            <Route path=":chatId" element={<Messages />} />
          </Route>

          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Notifications />} />
          </Route>

          {/* Test Routes */}
          <Route path="/seeding" element={<SeedingPage />} />
          <Route path="/admin-cleanup" element={<AdminCleanup />} />

          {/* Auth Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
          <Route path="/auth-action" element={<AuthAction />} />

          {/* Profile Routes */}
          <Route 
            path={ROUTES.PROFILE.ROOT} 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
            <Route path="edit" element={<EditProfile />} />
          </Route>

          {/* Become Freelancer Route */}
          <Route 
            path="/become-freelancer" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BecomeFreelancer />} />
          </Route>

          {/* Catch all - 404 */}
          <Route path="*" element={<NotFound />} />
                        </Routes>
          </NavigationRoleHandler>
        </Router>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;