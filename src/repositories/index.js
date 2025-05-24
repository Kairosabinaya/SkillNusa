import UserRepository from './UserRepository';
import ProfileRepository from './ProfileRepository';
import ProjectRepository from './ProjectRepository';
import ProposalRepository from './ProposalRepository';

// Create repository instances
export const userRepository = new UserRepository();
export const profileRepository = new ProfileRepository();
export const projectRepository = new ProjectRepository();
export const proposalRepository = new ProposalRepository();

// Export repository classes
export {
  UserRepository,
  ProfileRepository,
  ProjectRepository,
  ProposalRepository
}; 