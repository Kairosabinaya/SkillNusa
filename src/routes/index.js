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
  DASHBOARD: {
    ROOT: '/dashboard',
    FREELANCER: '/dashboard/freelancer',
    CLIENT: '/dashboard/client',
    ADMIN: '/dashboard/admin'
  },
  PROFILE: {
    ROOT: '/profile',
    EDIT: '/profile/edit'
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