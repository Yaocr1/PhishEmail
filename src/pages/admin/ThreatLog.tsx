import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { apiUrl, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type ThreatItem = {
  id: string;
  sender: string;
  subject: string;
  phishingProb: number;
  confidence: number;
  timestamp: string;
  provider: string;
  label: string;
};

export const ThreatLog = () => {
  const { user } = useAuth();
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreats = async () => {
    if (!user) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(apiUrl('/api/admin/threats?limit=200'), {
        headers: {
          'x-user-role': user.role,
        },
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage('Failed to load threat logs.', null, response.status));
      }

      const payload = (await response.json()) as ThreatItem[];
      setThreats(payload);
    } catch (threatError) {
      setError(getApiErrorMessage('Failed to load threat logs.', threatError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreats();
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/user" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Threat Logs</h1>
        <p className="text-sm text-gray-400 mt-1">Historical phishing detections stored for security research and future analytics.</p>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading threat logs...</div>
        ) : threats.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No phishing threats recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <th className="p-4 font-medium">Sender</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Provider</th>
                  <th className="p-4 font-medium">Risk</th>
                  <th className="p-4 font-medium">Confidence</th>
                  <th className="p-4 font-medium">Detected At</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {threats.map((item) => (
                  <tr key={item.id}>
                    <td className="p-4 text-gray-200 max-w-[220px] truncate">{item.sender}</td>
                    <td className="p-4 text-gray-300 max-w-[280px] truncate">{item.subject}</td>
                    <td className="p-4 text-gray-400">{item.provider}</td>
                    <td className="p-4 text-red-400">{(item.phishingProb * 100).toFixed(1)}%</td>
                    <td className="p-4 text-gray-300">{(item.confidence * 100).toFixed(1)}%</td>
                    <td className="p-4 text-gray-500">{new Date(item.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200 flex items-start gap-2">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        This log preserves detection records in the database so the dataset can support later research, model evaluation, and trend analysis.
      </div>
    </div>
  );
};
