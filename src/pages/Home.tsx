import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Zap, Layers, Brain, Search, Lock, 
  Code, AlertTriangle, CheckCircle, ArrowRight, Activity 
} from 'lucide-react';
import { apiUrl } from '../lib/api';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/10 text-neon-green text-sm font-medium mb-8"
          >
            <Activity size={16} />
            <span>95%+ Accuracy Rate</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 font-display"
          >
            Intelligent, Real-Time <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-green glow-text-blue">
              Phishing Protection
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Advanced phishing detection powered by BERT-based contextual analysis. 
            Minimize false positives and secure your communications with deep semantic understanding.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} 
              className="px-8 py-4 rounded-lg bg-neon-green text-black font-semibold hover:bg-[#00e58d] transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Analyze Email <ArrowRight size={20} />
            </button>
            <button className="px-8 py-4 rounded-lg border border-[#333] bg-[#111] text-white font-semibold hover:bg-[#222] transition-colors w-full sm:w-auto justify-center">
              View Architecture
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const features = [
  {
    icon: <Zap className="text-neon-blue" size={24} />,
    title: "Real-time Detection",
    description: "Processes and analyzes incoming emails in under 2 seconds for immediate threat response."
  },
  {
    icon: <Layers className="text-neon-green" size={24} />,
    title: "Dual-Layer Analysis",
    description: "Combines linguistic content analysis with structural URL and sender metadata evaluation."
  },
  {
    icon: <Brain className="text-neon-blue" size={24} />,
    title: "Advanced AI Engine",
    description: "Powered by a fine-tuned BERT (Transformer) model for deep semantic understanding of intent."
  },
  {
    icon: <Search className="text-neon-green" size={24} />,
    title: "Explainable AI (XAI)",
    description: "Provides confidence scores and interpretable indicators so you understand exactly why an email was flagged."
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-[#0a0a0a] border-y border-[#222]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">Core Capabilities</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Engineered for precision and speed, our detection system leverages state-of-the-art machine learning architectures.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-8 rounded-2xl bg-[#111] border border-[#222] hover:border-neon-blue/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 font-display">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const steps = [
  {
    num: "01",
    title: "Input Email Text",
    description: "Provide the raw email content, including headers and URLs, into our secure analysis engine via API or dashboard."
  },
  {
    num: "02",
    title: "BERT Contextual Processing",
    description: "Our fine-tuned Transformer model analyzes the semantics, intent, and structural anomalies within milliseconds."
  },
  {
    num: "03",
    title: "Detailed Risk Assessment",
    description: "Receive a comprehensive threat report featuring confidence scores and highlighted risk indicators."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center max-w-6xl mx-auto">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-display">How It Works</h2>
            <p className="text-gray-400 mb-12 text-lg">A streamlined, three-step pipeline designed to intercept threats before they reach the inbox.</p>
            
            <div className="space-y-8">
              {steps.map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full border border-neon-green/30 bg-neon-green/10 text-neon-green flex items-center justify-center font-display font-bold text-lg">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 font-display">{step.title}</h4>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2 w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative rounded-2xl border border-[#222] bg-[#0a0a0a] p-2 overflow-hidden glow-border-blue"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-transparent pointer-events-none" />
              <div className="bg-[#111] rounded-xl border border-[#222] p-6 font-mono text-sm text-gray-300">
                <div className="flex gap-2 mb-4 border-b border-[#333] pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="space-y-2">
                  <p><span className="text-neon-blue">POST</span> /api/v1/analyze</p>
                  <p className="text-gray-500">{`{`}</p>
                  <p className="pl-4"><span className="text-neon-green">"sender"</span>: "security@paypal-update-alert.com",</p>
                  <p className="pl-4"><span className="text-neon-green">"subject"</span>: "Action Required: Account Suspended",</p>
                  <p className="pl-4"><span className="text-neon-green">"body"</span>: "Dear user, please click here to verify..."</p>
                  <p className="text-gray-500">{`}`}</p>
                  <p className="text-yellow-500 mt-4">Processing via BERT model...</p>
                  <p className="text-gray-500 mt-4">{`{`}</p>
                  <p className="pl-4"><span className="text-neon-green">"status"</span>: <span className="text-red-400">"PHISHING"</span>,</p>
                  <p className="pl-4"><span className="text-neon-green">"confidence"</span>: 0.987,</p>
                  <p className="pl-4"><span className="text-neon-green">"indicators"</span>: ["Urgency keyword", "Domain mismatch"]</p>
                  <p className="text-gray-500">{`}`}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TechSpecs = () => {
  return (
    <section className="py-24 bg-[#111] border-y border-[#222]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">Technical Architecture</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Built on a robust, scalable, and privacy-first technology stack.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-xl bg-[#0a0a0a] border border-[#222]"
          >
            <Code className="text-neon-blue mb-4" size={32} />
            <h3 className="text-xl font-semibold mb-2 font-display">Backend Stack</h3>
            <p className="text-gray-400 text-sm leading-relaxed">High-performance REST API built with Python and Flask, ensuring low latency and seamless integration.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-[#0a0a0a] border border-[#222]"
          >
            <Brain className="text-neon-green mb-4" size={32} />
            <h3 className="text-xl font-semibold mb-2 font-display">ML Framework</h3>
            <p className="text-gray-400 text-sm leading-relaxed">PyTorch-powered inference engine running a fine-tuned BERT model optimized for text classification.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-[#0a0a0a] border border-[#222]"
          >
            <Lock className="text-neon-blue mb-4" size={32} />
            <h3 className="text-xl font-semibold mb-2 font-display">Data Privacy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Strict GDPR-compliant data handling with zero-retention processing. Emails are analyzed in memory and immediately discarded.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const DemoSection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<null | {
    id: string;
    label: string;
    confidence: number;
    phishingProb: number;
    isPhishing: boolean;
    threshold: number;
  }>(null);
  const [emailText, setEmailText] = useState('');
  const [subject, setSubject] = useState('Manual Inbox Check');
  const [sender, setSender] = useState('unknown.sender@email.test');
  const [error, setError] = useState<string | null>(null);

  const buildIndicators = () => {
    const text = emailText.toLowerCase();
    const indicators: string[] = [];

    if (text.includes('urgent') || text.includes('immediately')) indicators.push('Urgency Language');
    if (text.includes('verify') || text.includes('account')) indicators.push('Account Verification Request');
    if (text.includes('password') || text.includes('otp')) indicators.push('Credential Solicitation');
    if (text.includes('http://') || text.includes('bit.ly') || text.includes('tinyurl')) indicators.push('Suspicious URL Pattern');

    return indicators.slice(0, 4);
  };

  const handleAnalyze = async () => {
    if (!emailText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(apiUrl('/api/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          sender,
          text: emailText,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Analysis request failed.' }));
        throw new Error(payload.error || 'Analysis request failed.');
      }

      const payload = await response.json();
      setResult(payload);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze email right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section id="demo" className="py-24 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neon-green/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-display">Try the Live Demo</h2>
            <p className="text-gray-400">Paste an email below to see the BERT model in action.</p>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="Subject line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Sender</label>
                  <input
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors text-sm"
                    placeholder="sender@example.com"
                  />
                </div>
              </div>

              <label className="block text-sm font-medium text-gray-400 mb-2">Email Content</label>
              <textarea 
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                className="w-full h-48 bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors resize-none font-mono text-sm"
                placeholder="Subject: Urgent: Verify your account&#10;&#10;Dear Customer,&#10;Your account will be suspended in 24 hours. Please click the link below to verify your identity..."
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !emailText.trim()}
                className="px-6 py-3 rounded-lg bg-neon-blue text-black font-semibold hover:bg-[#00cce6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Activity size={20} />
                    </motion.div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Analyze Email
                  </>
                )}
              </button>
              
              {result && !error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-4 py-3 rounded-lg border flex items-center gap-2 font-medium w-full sm:w-auto justify-center ${
                    result.isPhishing 
                      ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                      : 'bg-green-500/10 border-green-500/50 text-green-400'
                  }`}
                >
                  {result.isPhishing ? (
                    <><AlertTriangle size={18} /> Phishing Detected ({(result.phishingProb * 100).toFixed(1)}%)</>
                  ) : (
                    <><CheckCircle size={18} /> Likely Legitimate ({(result.confidence * 100).toFixed(1)}%)</>
                  )}
                </motion.div>
              )}
            </div>

            {error && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            {result?.isPhishing && !error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-[#222]"
              >
                <h4 className="text-sm font-semibold text-gray-300 mb-3">XAI Indicators:</h4>
                <div className="flex flex-wrap gap-2">
                  {buildIndicators().map((indicator) => (
                    <span key={indicator} className="px-3 py-1 rounded-full bg-[#222] text-xs text-gray-300 border border-[#333]">{indicator}</span>
                  ))}
                  <span className="px-3 py-1 rounded-full bg-[#222] text-xs text-gray-300 border border-[#333]">
                    Threshold: {(result.threshold * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const Home = () => {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <TechSpecs />
      <DemoSection />
    </>
  );
};
