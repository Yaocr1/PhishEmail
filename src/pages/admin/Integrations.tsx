import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  CheckCircle, 
  RefreshCw, 
  ExternalLink,
  Shield,
  AlertTriangle,
  Activity,
  Server,
  Power,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { API_BASE_URL, apiUrl } from '../../lib/api';

interface ScannedEmail {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  timestamp: string;
  totalProcessed: number;
  analysis: {
    isPhishing: boolean;
    confidence: number;
    threatType: string;
    phishingProb?: number;
  };
}

interface IntegrationCard {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
  emailsProcessed: number;
  connectedEmail?: string | null;
}

const defaultIntegrations: IntegrationCard[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace (Gmail)',
    description: 'Connect via Gmail API using OAuth 2.0. This is the easiest free setup for student projects.',
    icon: <Mail className="text-white" size={24} />,
    color: 'from-blue-500 to-blue-600',
    status: 'disconnected',
    lastSync: 'Never',
    emailsProcessed: 0,
    connectedEmail: null,
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365 (Outlook)',
    description: 'Planned next: Microsoft Graph subscriptions for Outlook inbox monitoring.',
    icon: <div className="font-bold text-xl text-white">M</div>,
    color: 'from-blue-600 to-indigo-700',
    status: 'disconnected',
    lastSync: 'Not implemented',
    emailsProcessed: 0,
    connectedEmail: null,
  },
];

export const Integrations = () => {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [liveEmails, setLiveEmails] = useState<ScannedEmail[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationCard[]>(defaultIntegrations);
  const [statusError, setStatusError] = useState<string | null>(null);

  const allowedMessageOrigins = new Set<string>([window.location.origin]);
  if (API_BASE_URL) {
    try {
      allowedMessageOrigins.add(new URL(API_BASE_URL).origin);
    } catch {
      // ignore invalid URL values and continue with current origin only
    }
  }

  const refreshStatus = useCallback(async () => {
    try {
      setStatusError(null);
      const response = await fetch(apiUrl('/api/integrations/status'));
      if (!response.ok) {
        throw new Error('Unable to load integration status.');
      }

      const payload = await response.json();
      const lastSync = payload.gmail?.lastSync ? new Date(payload.gmail.lastSync).toLocaleString() : 'Never';

      setIntegrations((prev) => prev.map((integration) => {
        if (integration.id !== 'google-workspace') {
          return integration;
        }

        return {
          ...integration,
          status: payload.gmail?.connected ? 'connected' : 'disconnected',
          lastSync,
          emailsProcessed: Number(payload.totals?.processed || 0),
          connectedEmail: payload.gmail?.email || null,
        };
      }));
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Unable to load integration status.');
    }
  }, []);

  const googleStatus = integrations.find((integration) => integration.id === 'google-workspace')?.status;
  const isGoogleConnected = googleStatus === 'connected';

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!allowedMessageOrigins.has(event.origin)) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === 'google') {
        refreshStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshStatus]);

  // SSE Connection for Real-time Scanning
  useEffect(() => {
    if (!isGoogleConnected) {
      return;
    }

    const eventSource = new EventSource(apiUrl('/api/scan/stream'));
    eventSource.onmessage = (event) => {
      const data: ScannedEmail = JSON.parse(event.data);
      setLiveEmails((prev) => [data, ...prev].slice(0, 5));

      setIntegrations((prev) => prev.map((integration) => (
        integration.id === 'google-workspace'
          ? {
              ...integration,
              lastSync: 'Just now',
              emailsProcessed: data.totalProcessed,
            }
          : integration
      )));
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isGoogleConnected]);

  const handleSync = async (id: string) => {
    if (id !== 'google-workspace') {
      return;
    }

    setSyncing(id);
    await refreshStatus();
    setTimeout(() => {
      setSyncing(null);
    }, 500);
  };

  const handleDisconnect = async (providerId: string) => {
    if (providerId !== 'google-workspace') {
      return;
    }

    await fetch(apiUrl('/api/integrations/google/disconnect'), {
      method: 'POST',
    });

    setLiveEmails([]);
    refreshStatus();
  };

  const handleConnect = async (providerId: string) => {
    if (providerId !== 'google-workspace') {
      alert('Outlook support is planned next. Gmail is currently the fully implemented student-friendly option.');
      return;
    }

    try {
      // 1. Fetch the OAuth URL from your server
      const response = await fetch(apiUrl('/api/auth/google/url'));
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Failed to get auth URL' }));
        throw new Error(payload.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();

      // 2. Open the OAuth PROVIDER's URL directly in popup
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert(error instanceof Error ? error.message : 'Failed to initiate connection.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Email Integrations</h1>
        <p className="text-sm text-gray-400 mt-1">Connect your organization's email providers to enable real-time phishing detection.</p>
      </div>

      {statusError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {statusError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration, idx) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "bg-[#0a0a0a] border rounded-2xl p-6 relative overflow-hidden transition-all",
              integration.status === 'connected' ? "border-neon-green/30" : "border-white/5"
            )}
          >
            {/* Background Glow for Connected */}
            {integration.status === 'connected' && (
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/5 blur-[80px] rounded-full pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                integration.color
              )}>
                {integration.icon}
              </div>
              
              {integration.status === 'connected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-medium">
                  <CheckCircle size={14} />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-medium">
                  Not Connected
                </span>
              )}
            </div>

            <div className="relative z-10 mb-8">
              <h3 className="text-xl font-semibold text-white mb-2">{integration.name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{integration.description}</p>
              {integration.connectedEmail && (
                <p className="text-xs text-neon-green mt-2">Connected inbox: {integration.connectedEmail}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
              <div className="bg-[#111] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Sync</p>
                <p className="text-sm font-medium text-gray-200">{integration.lastSync}</p>
              </div>
              <div className="bg-[#111] border border-white/5 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Emails Processed</p>
                  <p className="text-sm font-medium text-gray-200">{integration.emailsProcessed.toLocaleString()}</p>
                </div>
                {integration.status === 'connected' && (
                  <Activity size={16} className="text-neon-green animate-pulse" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              {integration.status === 'connected' ? (
                <>
                  <button 
                    onClick={() => handleSync(integration.id)}
                    disabled={syncing === integration.id}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={cn(syncing === integration.id && "animate-spin")} />
                    {syncing === integration.id ? 'Syncing...' : 'Force Sync'}
                  </button>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="p-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                    title="Disconnect"
                  >
                    <Power size={18} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleConnect(integration.id)}
                  className="w-full px-4 py-2.5 bg-neon-blue text-black hover:bg-[#00cce6] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={16} />
                  Connect Account
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Scanning Feed */}
      {isGoogleConnected && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] border border-white/5 rounded-2xl p-6 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-green/10 rounded-lg text-neon-green">
                <Server size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Live PhishBERT Engine</h3>
                <p className="text-xs text-gray-400">Real-time email interception & analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 rounded-full border border-neon-green/20">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs font-medium text-neon-green">Engine Active</span>
            </div>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {liveEmails.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500 text-sm"
                >
                  Waiting for incoming emails...
                </motion.div>
              ) : (
                liveEmails.map((email) => (
                  <motion.div
                    key={email.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between gap-4",
                      email.analysis.isPhishing 
                        ? "bg-red-500/5 border-red-500/20" 
                        : "bg-white/5 border-white/5"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-200 truncate">{email.sender}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">{new Date(email.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-white font-medium truncate mb-1">{email.subject}</p>
                      <p className="text-xs text-gray-400 truncate">{email.snippet}</p>
                    </div>
                    
                    <div className="shrink-0 text-right">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium mb-1",
                        email.analysis.isPhishing 
                          ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                          : "bg-neon-green/10 text-neon-green border border-neon-green/20"
                      )}>
                        {email.analysis.isPhishing ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {email.analysis.isPhishing ? 'Phishing Detected' : 'Clean'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Confidence: {(email.analysis.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* How it works section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#111] border border-white/5 rounded-2xl p-8 mt-8"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-neon-blue/10 rounded-xl text-neon-blue">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">How Integration Works</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-3xl leading-relaxed">
              PhishBERT uses OAuth 2.0 to securely connect to your email provider. We set up real-time webhooks (Pub/Sub for Google, Graph Subscriptions for Microsoft) to receive notifications the moment an email arrives. The email is fetched, analyzed by our BERT model in memory, and if flagged as phishing, it is automatically moved to quarantine or tagged with a warning label before the user even opens it.
            </p>
            
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm">
                <span className="text-gray-200 font-medium">Privacy First: </span>
                <span className="text-gray-400">Emails are processed entirely in memory and are never stored on our servers. We only retain metadata (sender domain, timestamp, risk score) for your dashboard analytics.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
