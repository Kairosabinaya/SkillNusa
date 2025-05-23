import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-12">
          <Link to="/" className="flex items-center transition-all duration-300">
            <span className="text-lg font-bold cursor-pointer bg-gradient-to-r from-[#010042] to-[#0100a3] bg-clip-text text-transparent" style={{letterSpacing: "0.5px"}}>SkillNusa</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
              Home
            </Link>
            <Link to="/about" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
              About
            </Link>
            <Link to="/contact" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
              Contact
            </Link>
          </nav>

          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                {userProfile && (
                  <Link to="/dashboard" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                    Dashboard
                  </Link>
                )}
                
                <Menu as="div" className="relative ml-3">
                  <div>
                    <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                      <span className="sr-only">Open user menu</span>
                      <div className="h-7 w-7 rounded-full bg-[#010042]/10 flex items-center justify-center text-[#010042]">
                        {userProfile?.profilePhoto ? (
                          <img className="h-7 w-7 rounded-full" src={userProfile.profilePhoto} alt={userProfile.displayName} />
                        ) : (
                          <span className="text-sm">{userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                        )}
                      </div>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link to="/profile" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link to="/profile/edit" className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700`}>
                              Settings
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Login
                </Link>
                <Link to="/register" className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 