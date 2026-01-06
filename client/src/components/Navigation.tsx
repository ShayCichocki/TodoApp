import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <nav className="border-b border-moss-600 bg-forest-600">
      <div className="mx-auto max-w-4xl px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-1">
            {isAuthenticated && (
              <>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-forest-700 text-white'
                        : 'text-forest-100 hover:bg-forest-600 hover:text-white'
                    }`
                  }
                >
                  Todos
                </NavLink>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-forest-700 text-white'
                        : 'text-forest-100 hover:bg-forest-600 hover:text-white'
                    }`
                  }
                >
                  Reports
                </NavLink>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/login"
                  className="rounded-md px-4 py-2 text-sm font-medium text-forest-100 transition-colors hover:bg-forest-600 hover:text-white"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-800"
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-forest-100 transition-colors hover:bg-forest-700 hover:text-white"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-800 text-white">
                    {user?.email[0]?.toUpperCase()}
                  </div>
                  <span>{user?.email}</span>
                  <svg
                    className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          navigate('/profile');
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
