import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { apiUrl, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type AnalysisResult = {
  id: string;
  label: string;
  confidence: number;
  phishingProb: number;
  isPhishing: boolean;
  threshold: number;
};

type UserScan = {
  id: string;
  subject: string;
  sender: string;
  isPhishing: boolean;
  confidence: number;
  phishingProb: number;
  timestamp: string;
};

export const UserDashboard = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('Manual Inbox Check');
  const [sender, setSender] = useState('unknown.sender@email.test');
  const [emailText, setEmailText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<UserScan[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistory = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/user/scans?userId=${encodeURIComponent(user.id)}&limit=20`));
      if (!response.ok) {
        throw new Error(getApiErrorMessage('Failed to load your scan history.', null, response.status));
      }

      const payload = (await response.json()) as UserScan[];
      setScanHistory(payload);
    } catch (historyError) {
      setError(getApiErrorMessage('Failed to load your scan history.', historyError));
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'USER') {
    return <Navigate to="/admin" replace />;
  }

  const handleAnalyze = async () => {
    if (!emailText.trim()) {
      setError('Please enter email content to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const response = await fetch(apiUrl('/api/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          userId: user.id,
          subject,
          sender,
          text: emailText,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: getApiErrorMessage('Analysis request failed.', null, response.status) }));
        throw new Error(payload.error || getApiErrorMessage('Analysis request failed.', null, response.status));
      }

      const payload = (await response.json()) as AnalysisResult;
      setAnalysisResult(payload);
      await loadHistory();
    } catch (analysisError) {
      setError(getApiErrorMessage('Analysis request failed.', analysisError));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="py-12 container mx-auto px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">User Dashboard</h1>
        <p className="text-gray-400 mt-2">Analyze your email content and review your scan history.</p>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8 shadow-2xl">
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email Subject</label>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors text-sm"
                placeholder="Subject line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Sender</label>
              <input
                value={sender}
                onChange={(event) => setSender(event.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] rounded-xl p-3 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors text-sm"
                placeholder="sender@example.com"
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-400 mb-2">Email Content</label>
          <textarea
            value={emailText}
            onChange={(event) => setEmailText(event.target.value)}
            className="w-full h-40 bg-[#0a0a0a] border border-[#333] rounded-xl p-4 text-gray-200 focus:outline-none focus:border-neon-blue transition-colors resize-none font-mono text-sm"
            placeholder="Paste the email body to analyze..."
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-lg bg-neon-blue text-black font-semibold hover:bg-[#00cce6] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Search size={18} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Email'}
          </button>

          {analysisResult && (
            <div
              className={`px-4 py-3 rounded-lg border text-sm font-medium ${
                analysisResult.isPhishing
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : 'bg-green-500/10 border-green-500/40 text-green-400'
              }`}
            >
              {analysisResult.isPhishing ? (
                <span className="flex items-center gap-2"><AlertTriangle size={16} /> Phishing Detected ({(analysisResult.phishingProb * 100).toFixed(1)}%)</span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle size={16} /> Likely Legitimate ({(analysisResult.confidence * 100).toFixed(1)}%)</span>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-xl font-semibold">Your Threat Scan History</h2>
        </div>

        {historyLoading ? (
          <div className="p-6 text-gray-500 text-sm">Loading your history...</div>
        ) : scanHistory.length === 0 ? (
          <div className="p-6 text-gray-500 text-sm">No scans yet. Analyze your first email above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Sender</th>
                  <th className="p-4 font-medium">Risk</th>
                  <th className="p-4 font-medium">Result</th>
                  <th className="p-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {scanHistory.map((scan) => (
                  <tr key={scan.id}>
                    <td className="p-4 text-gray-200 max-w-[260px] truncate">{scan.subject}</td>
                    <td className="p-4 text-gray-400 max-w-[220px] truncate">{scan.sender}</td>
                    <td className="p-4 text-gray-300">{(scan.phishingProb * 100).toFixed(1)}%</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          scan.isPhishing ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-green-500/10 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {scan.isPhishing ? 'Phishing' : 'Legitimate'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{new Date(scan.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
