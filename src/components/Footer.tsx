import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-[#222] bg-[#0a0a0a] text-gray-500 text-sm">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 text-xl font-display font-bold text-white mb-4">
            <span>Phish<span className="text-neon-green">BERT</span></span>
          </div>
          <p className="mb-4">Intelligent Phishing Email Detection System powered by advanced NLP and deep learning.</p>
          <p>&copy; {new Date().getFullYear()} Final Year Project</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Product</h4>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-neon-blue transition-colors">Features</Link></li>
            <li><Link to="/" className="hover:text-neon-blue transition-colors">How it Works</Link></li>
            <li><Link to="/" className="hover:text-neon-blue transition-colors">Live Demo</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-neon-blue transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-neon-blue transition-colors">Contact</Link></li>
            <li><Link to="#" className="hover:text-neon-blue transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4">Connect</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-neon-blue transition-colors">GitHub</a></li>
            <li><a href="#" className="hover:text-neon-blue transition-colors">Twitter</a></li>
            <li><a href="#" className="hover:text-neon-blue transition-colors">LinkedIn</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
