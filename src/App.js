import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './routes';
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
import Transactions from './pages/Transactions';
import Messages from './pages/Messages';

// Dashboard Pages
import ClientDashboard from './pages/Dashboard/ClientDashboard';
import ClientTransactions from './pages/Dashboard/ClientTransactions';
import ClientCart from './pages/Dashboard/ClientCart';
import ClientFavorites from './pages/Dashboard/ClientFavorites';
import ClientMessages from './pages/Dashboard/ClientMessages';

// Test Pages
import TestPopulate from './pages/TestPopulate';
import SeedingPage from './pages/SeedingPage';

// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import DashboardRedirect from './components/DashboardRedirect';

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

          {/* Dashboard Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['client', 'freelancer', 'admin']}>
                  <DashboardLayout />
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
            
            {/* TODO: Add Freelancer Dashboard Routes */}
            {/* TODO: Add Admin Dashboard Routes */}
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
          <Route path="/seeding" element={<SeedingPage />} />

          {/* Auth Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

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