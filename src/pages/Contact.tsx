import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, MapPin } from 'lucide-react';
import { apiUrl } from '../lib/api';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to send message.' }));
        throw new Error(payload.error || 'Unable to send message.');
      }

      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (submitError) {
      setIsSubmitting(false);
      setError(submitError instanceof Error ? submitError.message : 'Unable to send message.');
    }
  };

  return (
    <div className="py-20 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">Get in Touch</h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Have questions about the project, want to request access to the API, or interested in the research? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-1 space-y-6"
            >
              <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue flex-shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Email</h4>
                  <p className="text-sm text-gray-400">contact@phishbert.edu</p>
                </div>
              </div>
              
              <div className="bg-[#111] border border-[#222] rounded-2xl p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center text-neon-green flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">Location</h4>
                  <p className="text-sm text-gray-400">Computer Science Department<br/>University Campus</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 bg-[#111] border border-[#222] rounded-2xl p-8"
            >
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mb-6">
                    <Send size={32} />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400">Thank you for reaching out. We'll get back to you shortly.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-8 px-6 py-2 rounded-lg border border-[#333] hover:bg-[#222] transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Your Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-blue transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                    <textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="w-full h-32 bg-[#0a0a0a] border border-[#333] rounded-lg py-3 px-4 text-white focus:outline-none focus:border-neon-blue transition-colors resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-lg bg-neon-blue text-black font-semibold hover:bg-[#00cce6] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>Send Message <Send size={18} /></>
                    )}
                  </button>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
