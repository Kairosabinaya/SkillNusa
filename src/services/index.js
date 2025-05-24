import AuthService from './AuthService';
import UserService from './UserService';
import ProjectService from './ProjectService';

// Create service instances
export const authService = new AuthService();
export const userService = new UserService();
export const projectService = new ProjectService();

// Export service classes
export {
  AuthService,
  UserService,
  ProjectService
}; 