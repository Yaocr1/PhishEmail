/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { AdminLayout } from './components/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Integrations } from './pages/admin/Integrations';
import { AuthProvider } from './contexts/AuthContext';

// Layout for public pages
const PublicLayout = () => (
  <div className="min-h-screen bg-[#050505] text-white selection:bg-neon-green selection:text-black font-sans flex flex-col">
    <Navbar />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="integrations" element={<Integrations />} />
            {/* Add placeholders for other admin routes to prevent 404s if clicked */}
            <Route path="threats" element={<div className="text-white p-8">Threat Log (Coming Soon)</div>} />
            <Route path="analytics" element={<div className="text-white p-8">Analytics (Coming Soon)</div>} />
            <Route path="settings" element={<div className="text-white p-8">Settings (Coming Soon)</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


