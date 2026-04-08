import React from 'react';
import { motion } from 'motion/react';
import { Shield, Users, Target, BookOpen } from 'lucide-react';

export const About = () => {
  return (
    <div className="py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-6">About the Project</h1>
            <p className="text-xl text-gray-400">
              PhishBERT is a Final Year Project dedicated to solving the growing threat of sophisticated phishing attacks using state-of-the-art Natural Language Processing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#111] border border-[#222] rounded-2xl p-8"
            >
              <Target className="text-neon-blue mb-4" size={32} />
              <h3 className="text-2xl font-bold font-display mb-4">Our Mission</h3>
              <p className="text-gray-400 leading-relaxed">
                To provide an accessible, high-accuracy, and explainable phishing detection system that empowers users to identify malicious emails before they cause harm. We believe that cybersecurity should be proactive and understandable.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#111] border border-[#222] rounded-2xl p-8"
            >
              <BookOpen className="text-neon-green mb-4" size={32} />
              <h3 className="text-2xl font-bold font-display mb-4">The Research</h3>
              <p className="text-gray-400 leading-relaxed">
                Traditional phishing detection relies heavily on blacklists and simple heuristics, which fail against zero-day attacks. Our research leverages BERT (Bidirectional Encoder Representations from Transformers) to understand the semantic intent behind email text, achieving a 95%+ accuracy rate.
              </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-[#222] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/5 blur-[80px] rounded-full pointer-events-none" />
            <Users className="text-neon-blue mx-auto mb-6" size={48} />
            <h2 className="text-3xl font-bold font-display mb-6">The Team</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Developed as a comprehensive Final Year Project by computer science students passionate about cybersecurity and artificial intelligence.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#333] bg-[#1a1a1a]">
              <Shield className="text-neon-green" size={20} />
              <span className="font-medium text-gray-300">University Project 2025-2026</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
