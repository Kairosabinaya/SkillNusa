import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROUTES, ROLES } from './routes';

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

// Protected Routes
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path={ROUTES.ABOUT.slice(1)} element={<About />} />
            <Route path={ROUTES.CONTACT.slice(1)} element={<Contact />} />
          </Route>

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
              element={
                <RoleRoute roles={[ROLES.FREELANCER, ROLES.ADMIN]}>
                  <FreelancerDashboard />
                </RoleRoute>
              } 
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

          {/* Catch all - 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;