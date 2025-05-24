import { Link } from 'react-router-dom';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
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
              Beranda
            </Link>
            <Link to="/about" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
              Tentang
            </Link>
            <Link to="/contact" className="inline-flex items-center px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-[#010042] transition-all duration-200">
              Kontak
            </Link>
          </nav>

          <div className="flex items-center">
            {currentUser ? (
              <div className="flex items-center">
                <Menu as="div" className="relative">
                  <MenuButton className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                    <span className="sr-only">Buka menu pengguna</span>
                    <div className="h-8 w-8 rounded-full bg-[#010042]/10 flex items-center justify-center text-[#010042] overflow-hidden border border-gray-200 hover:border-[#010042] transition-all duration-200">
                      {userProfile?.profilePhoto ? (
                        <img className="h-8 w-8 rounded-full object-cover" src={userProfile.profilePhoto} alt={userProfile.displayName} />
                      ) : (
                        <span className="text-sm font-semibold">{userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </MenuButton>
                  
                  <MenuItems 
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                  >
                    <div className="border-b border-gray-100 pb-2 pt-1 px-4">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userProfile?.displayName || 'Pengguna'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userProfile?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <MenuItem>
                        {({ active }) => (
                          <Link to="/profile" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Profil Saya
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link to="/profile/edit" className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}>
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#010042]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                            </svg>
                            Pengaturan
                          </Link>
                        )}
                      </MenuItem>
                      <div className="border-t border-gray-100 my-1"></div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <svg className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm9 2.586L15.414 9H12V5.586zM4 6a1 1 0 011-1h4a1 1 0 010 2H5a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H5zm0 3a1 1 0 100 2h3a1 1 0 100-2H5z" clipRule="evenodd" />
                            </svg>
                            Keluar
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Masuk
                </Link>
                <Link to="/register" className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 