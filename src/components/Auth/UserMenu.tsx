/**
 * User Menu Component
 * Displays user info and authentication status
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

export const UserMenu: React.FC = () => {
  const { user, isAuthenticated, logout, requireAuth } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogin = () => {
    requireAuth();
  };

  if (!isAuthenticated) {
    return (
      <motion.button
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogin}
      >
        <span>👤</span>
        <span>Sign In</span>
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">{user?.name}</div>
          <div className="text-xs text-gray-500 capitalize">
            {user?.subscription?.plan || 'Free'} Plan
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {/* User Info */}
              <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-sm opacity-90">{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div className="p-4 border-b dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Plan</div>
                    <div className="font-semibold capitalize">
                      {user?.subscription?.plan || 'Free'}
                      {user?.subscription?.plan === 'pro' && ' ⭐'}
                      {user?.subscription?.plan === 'enterprise' && ' 👑'}
                    </div>
                  </div>
                  {user?.subscription?.plan !== 'enterprise' && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // Open upgrade modal
                      }}
                      className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Open profile settings
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Open billing
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>💳</span>
                  <span>Billing</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    // Open help
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>❓</span>
                  <span>Help & Support</span>
                </button>

                <hr className="my-2 dark:border-gray-800" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-red-600 dark:text-red-400"
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
