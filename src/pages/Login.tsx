import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { apiUrl, getApiErrorMessage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: getApiErrorMessage('Login failed.', null, response.status) }));
        throw new Error(payload.error || getApiErrorMessage('Login failed.', null, response.status));
      }

      const payload = await response.json();
      const normalizedRole = String(payload?.role || '').toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';

      login({
        id: String(payload?.id || crypto.randomUUID()),
        email: String(payload?.email || email),
        role: normalizedRole,
      });

        navigate(normalizedRole === 'ADMIN' ? '/admin' : '/user');
      
      
    } catch (loginError) {
      setError(getApiErrorMessage('Login failed.', loginError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/10 blur-[100px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111] border border-[#222] rounded-2xl p-8 shadow-2xl relative z-10 glow-border-blue"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue mb-4">
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Single login for both admin and user accounts.</p>
          <p className="text-xs text-gray-500 mt-3">Default admin: admin@phishbert.app / Admin@12345</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-400">Password</label>
              <a href="#" className="text-xs text-neon-blue hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-neon-blue text-black font-semibold hover:bg-[#00cce6] transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
          >
            {isSubmitting ? 'Signing In...' : <>Sign In <ArrowRight size={18} /></>}
          </button>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account? <Link to="/signup" className="text-neon-blue hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};
