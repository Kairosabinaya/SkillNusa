import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROUTES, ROLES } from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import PublicLayout from './components/Layout/PublicLayout';
import DashboardLayout from './components/Layout/DashboardLayout';

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

// Dashboard Pages
import FreelancerDashboard from './pages/Dashboard/FreelancerDashboard';
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
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
import Transactions from './pages/Transactions';
import Messages from './pages/Messages';

// Test Pages
import TestPopulate from './pages/TestPopulate';

// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
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

          {/* Client Feature Routes */}
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
            path="/transactions" 
            element={
              <ProtectedRoute>
                <PublicLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Transactions />} />
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

          {/* Test Routes */}
          <Route path="/test-populate" element={<TestPopulate />} />

          {/* Auth Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

          {/* Dashboard Routes */}
          <Route 
            path={ROUTES.DASHBOARD.ROOT} 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to={ROUTES.DASHBOARD.CLIENT} replace />} />
            <Route 
              path="freelancer" 
              element={<FreelancerDashboard />} 
            />
            <Route 
              path="client" 
              element={
                <RoleRoute roles={[ROLES.CLIENT, ROLES.ADMIN]}>
                  <ClientDashboard />
                </RoleRoute>
              } 
            />
            <Route 
              path="admin" 
              element={
                <RoleRoute roles={[ROLES.ADMIN]}>
                  <AdminDashboard />
                </RoleRoute>
              } 
            />
          </Route>

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
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;