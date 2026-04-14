import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { apiUrl, getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

type AnalyticsPayload = {
  totals: {
    users: number;
    scans: number;
    threats: number;
    threatRate: number;
  };
  scansByDay: Array<{ day: string; scans: number; threats: number }>;
  topSenders: Array<{ sender: string; threats: number }>;
};

const emptyPayload: AnalyticsPayload = {
  totals: { users: 0, scans: 0, threats: 0, threatRate: 0 },
  scansByDay: [],
  topSenders: [],
};

export const Analytics = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await fetch(apiUrl('/api/admin/analytics'), {
        headers: {
          'x-user-role': user.role,
        },
      });

      if (!response.ok) {
        throw new Error(getApiErrorMessage('Failed to load analytics.', null, response.status));
      }

      const payload = (await response.json()) as AnalyticsPayload;
      setData(payload);
    } catch (analyticsError) {
      setError(getApiErrorMessage('Failed to load analytics.', analyticsError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
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
        <h1 className="text-2xl font-display font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Database-backed trends to support monitoring and future phishing research.</p>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Registered Users" value={String(data.totals.users)} />
        <StatCard label="Total Scans" value={String(data.totals.scans)} />
        <StatCard label="Threat Detections" value={String(data.totals.threats)} />
        <StatCard label="Threat Rate" value={`${(data.totals.threatRate * 100).toFixed(2)}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 min-h-[360px]">
          <h2 className="text-lg font-semibold mb-4">Scans vs Threats (Last 14 Days)</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading chart...</p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.scansByDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="day" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="scans" stroke="#00e5ff" strokeWidth={2} />
                  <Line type="monotone" dataKey="threats" stroke="#ff3366" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 min-h-[360px]">
          <h2 className="text-lg font-semibold mb-4">Top Threat Senders</h2>
          {loading ? (
            <p className="text-sm text-gray-500">Loading chart...</p>
          ) : data.topSenders.length === 0 ? (
            <p className="text-sm text-gray-500">No threat sender distribution available yet.</p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topSenders} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="sender" stroke="#666" tick={{ fill: '#888', fontSize: 11 }} interval={0} angle={-15} height={60} textAnchor="end" />
                  <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                  <Bar dataKey="threats" fill="#b026ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5">
    <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-display font-bold text-white">{value}</p>
  </div>
);
