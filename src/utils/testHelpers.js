/**
 * Test Helpers and Utilities for SkillNusa
 * Provides common testing utilities, mocks, and setup functions
 */

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

/**
 * Custom render function with providers
 * @param {React.Component} ui - Component to render
 * @param {object} options - Render options
 * @returns {object} - Render result
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock user data for testing
 */
export const mockUsers = {
  client: {
    uid: 'client-123',
    email: 'client@test.com',
    username: 'testclient',
    displayName: 'Test Client',
    role: 'client',
    roles: ['client'],
    activeRole: 'client',
    isActive: true,
    emailVerified: true
  },
  freelancer: {
    uid: 'freelancer-123',
    email: 'freelancer@test.com',
    username: 'testfreelancer',
    displayName: 'Test Freelancer',
    role: 'freelancer',
    roles: ['freelancer'],
    activeRole: 'freelancer',
    isActive: true,
    emailVerified: true
  },
  admin: {
    uid: 'admin-123',
    email: 'admin@test.com',
    username: 'testadmin',
    displayName: 'Test Admin',
    role: 'admin',
    roles: ['admin'],
    activeRole: 'admin',
    isActive: true,
    emailVerified: true
  },
  multiRole: {
    uid: 'multi-123',
    email: 'multi@test.com',
    username: 'testmulti',
    displayName: 'Test Multi Role',
    role: 'client',
    roles: ['client', 'freelancer'],
    activeRole: 'client',
    isActive: true,
    emailVerified: true
  }
};

/**
 * Mock project data for testing
 */
export const mockProjects = {
  active: {
    id: 'project-123',
    title: 'Test Project',
    description: 'This is a test project description',
    budget: 1000,
    status: 'active',
    clientId: 'client-123',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  completed: {
    id: 'project-456',
    title: 'Completed Project',
    description: 'This is a completed project',
    budget: 2000,
    status: 'completed',
    clientId: 'client-123',
    freelancerId: 'freelancer-123',
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

/**
 * Mock Firebase Auth functions
 */
export const mockFirebaseAuth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  onAuthStateChanged: jest.fn()
};

/**
 * Mock Firestore functions
 */
export const mockFirestore = {
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn()
};

/**
 * Mock Firebase Storage functions
 */
export const mockFirebaseStorage = {
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
};

/**
 * Test data generators
 */
export const generateTestData = {
  user: (overrides = {}) => ({
    ...mockUsers.client,
    ...overrides,
    uid: `user-${Date.now()}`,
    email: `test${Date.now()}@example.com`
  }),
  
  project: (overrides = {}) => ({
    ...mockProjects.active,
    ...overrides,
    id: `project-${Date.now()}`,
    title: `Test Project ${Date.now()}`
  }),
  
  profile: (overrides = {}) => ({
    userId: 'user-123',
    bio: 'Test bio',
    skills: ['JavaScript', 'React'],
    experience: 'intermediate',
    hourlyRate: 50,
    isOnline: false,
    ...overrides
  })
};

/**
 * Wait for async operations in tests
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock console methods for testing
 */
export const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

/**
 * Setup function for tests
 */
export const setupTest = () => {
  // Mock console methods
  global.console = {
    ...console,
    ...mockConsole
  };
  
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  global.localStorage = localStorageMock;
  
  // Mock sessionStorage
  global.sessionStorage = localStorageMock;
  
  // Mock window.location
  delete window.location;
  window.location = {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  };
};

/**
 * Cleanup function for tests
 */
export const cleanupTest = () => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
};

/**
 * Assert helpers
 */
export const assertions = {
  /**
   * Assert that an element has specific text content
   */
  hasText: (element, text) => {
    expect(element).toHaveTextContent(text);
  },
  
  /**
   * Assert that an element has specific class
   */
  hasClass: (element, className) => {
    expect(element).toHaveClass(className);
  },
  
  /**
   * Assert that a function was called with specific arguments
   */
  calledWith: (mockFn, ...args) => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  },
  
  /**
   * Assert that a function was called specific number of times
   */
  calledTimes: (mockFn, times) => {
    expect(mockFn).toHaveBeenCalledTimes(times);
  }
};

export default {
  renderWithProviders,
  mockUsers,
  mockProjects,
  mockFirebaseAuth,
  mockFirestore,
  mockFirebaseStorage,
  generateTestData,
  waitFor,
  mockConsole,
  setupTest,
  cleanupTest,
  assertions
}; 