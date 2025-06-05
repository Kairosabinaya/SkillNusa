import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import Header from './Header';
import Footer from './Footer';

/**
 * Layout for public pages with header and footer
 */
export default function PublicLayout({ className = '' }) {
  return (
    <div className={`flex flex-col min-h-screen overflow-hidden ${className}`}>
      <Header />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

PublicLayout.propTypes = {
  className: PropTypes.string
};