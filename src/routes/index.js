/**
 * Route constants for the application
 */

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_EMAIL: '/verify-email',
  PROFILE: {
    ROOT: '/profile',
    EDIT: '/profile/edit'
  },
  DASHBOARD: {
    ROOT: '/dashboard',
    CLIENT: '/dashboard/client',
    FREELANCER: '/dashboard/freelancer',
    ADMIN: '/dashboard/admin'
  }
};

/**
 * Role constants for the application
 */
export const ROLES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  ADMIN: 'admin'
}; 