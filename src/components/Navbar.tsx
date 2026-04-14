import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <nav className="border-b border-[#222] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-display font-bold">
          <Shield className="text-neon-blue" />
          <span>Phish<span className="text-neon-green">BERT</span></span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/about" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">About</Link>
          <Link to="/contact" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Contact</Link>

          {isAuthenticated ? (
            <>
              <div className="h-4 w-px bg-[#333]"></div>
              <Link to={isAdmin ? '/admin' : '/user'} className="text-sm font-medium text-neon-blue hover:text-white transition-colors">
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm font-medium px-4 py-2 rounded-lg border border-[#333] text-gray-300 hover:text-white hover:bg-[#111] transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <div className="h-4 w-px bg-[#333]"></div>
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log In</Link>
              <Link to="/signup" className="text-sm font-medium px-4 py-2 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 transition-colors">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
