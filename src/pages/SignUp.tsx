import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { apiUrl } from '../lib/api';

export const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/auth/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Sign-up failed.' }));
        throw new Error(payload.error || 'Sign-up failed.');
      }

      navigate('/login');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Sign-up failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl relative z-10"
        style={{ boxShadow: '0 0 30px rgba(0, 255, 157, 0.05)' }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-2">Create an Account</h1>
          <p className="text-gray-400 text-sm">Join PhishBERT to secure your communications.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-green transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Must be at least 8 characters long.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-neon-green text-black font-semibold hover:bg-[#00e58d] transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
          >
            {isSubmitting ? 'Creating Account...' : <>Create Account <ArrowRight size={18} /></>}
          </button>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-neon-green hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};
