import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Mail, 
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface DashboardSummary {
  stats: {
    totalScanned24h: number;
    threatsBlocked24h: number;
    falsePositiveRate: number;
    avgProcessingTimeSec: number;
  };
  chart: Array<{ time: string; scanned: number; blocked: number }>;
  threatTypes: Array<{ name: string; value: number }>;
  recentThreats: Array<{
    id: string;
    sender: string;
    subject: string;
    score: number;
    time: string;
    status: string;
  }>;
}

const emptySummary: DashboardSummary = {
  stats: {
    totalScanned24h: 0,
    threatsBlocked24h: 0,
    falsePositiveRate: 0,
    avgProcessingTimeSec: 0,
  },
  chart: [],
  threatTypes: [],
  recentThreats: [],
};

const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};

const formatRelative = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setError(null);
      const response = await fetch('/api/dashboard/summary');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data.');
      }
      const payload = await response.json();
      setSummary(payload);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (summary.chart.length > 0) {
      return summary.chart;
    }

    return [
      { time: '00:00', scanned: 0, blocked: 0 },
      { time: '04:00', scanned: 0, blocked: 0 },
      { time: '08:00', scanned: 0, blocked: 0 },
      { time: '12:00', scanned: 0, blocked: 0 },
      { time: '16:00', scanned: 0, blocked: 0 },
      { time: '20:00', scanned: 0, blocked: 0 },
    ];
  }, [summary.chart]);

  const threatTypes = summary.threatTypes.length > 0
    ? summary.threatTypes
    : [{ name: 'No threats yet', value: 0 }];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Security Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time threat analysis and system metrics.</p>
          {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
            </span>
            System Active
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors">
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Scanned (24h)" 
          value={formatCompactNumber(summary.stats.totalScanned24h)} 
          change="Live" 
          trend="up" 
          icon={<Mail className="text-neon-blue" size={20} />} 
          isLoading={isLoading}
        />
        <StatCard 
          title="Threats Blocked" 
          value={formatCompactNumber(summary.stats.threatsBlocked24h)} 
          change="Live" 
          trend="up" 
          icon={<ShieldAlert className="text-neon-red" size={20} />} 
          isLoading={isLoading}
        />
        <StatCard 
          title="False Positive Rate" 
          value={`${(summary.stats.falsePositiveRate * 100).toFixed(2)}%`} 
          change="Live" 
          trend="down" 
          icon={<CheckCircle className="text-neon-green" size={20} />} 
          isLoading={isLoading}
        />
        <StatCard 
          title="Avg Processing Time" 
          value={`${summary.stats.avgProcessingTimeSec.toFixed(1)}s`} 
          change="Live" 
          trend="down" 
          icon={<Clock className="text-neon-purple" size={20} />} 
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative min-h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold font-display">Traffic & Detections</h2>
            <select className="bg-[#111] border border-white/10 rounded-lg px-3 py-1 text-sm text-gray-300 focus:outline-none focus:border-neon-blue disabled:opacity-50" disabled={isLoading}>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-10 rounded-2xl">
              <Loader2 className="animate-spin text-neon-blue" size={32} />
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff3366" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#666" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="scanned" stroke="#00e5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorScanned)" />
                  <Area type="monotone" dataKey="blocked" stroke="#ff3366" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Threat Types Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative min-h-[400px]"
        >
          <h2 className="text-lg font-semibold font-display mb-6">Threat Distribution</h2>
          
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/50 backdrop-blur-sm z-10 rounded-2xl">
              <Loader2 className="animate-spin text-neon-purple" size={32} />
            </div>
          ) : (
            <div className="h-[300px] w-full flex flex-col justify-center">
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={threatTypes} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#666" tick={{ fill: '#aaa', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip 
                    cursor={{ fill: '#1a1a1a' }}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                  />
                  <Bar dataKey="value" fill="#b026ff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Threats Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden relative min-h-[300px]"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold font-display">Recent High-Confidence Threats</h2>
          <button className="text-sm text-neon-blue hover:text-white transition-colors disabled:opacity-50" disabled={isLoading}>View All Logs</button>
        </div>
        
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 bg-white/5 rounded w-1/4"></div>
                <div className="h-4 bg-white/5 rounded w-1/3"></div>
                <div className="h-4 bg-white/5 rounded w-1/6"></div>
                <div className="h-4 bg-white/5 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#111] text-xs uppercase tracking-wider text-gray-500 border-b border-white/5">
                  <th className="p-4 font-medium">Sender</th>
                  <th className="p-4 font-medium">Subject</th>
                  <th className="p-4 font-medium">Risk Score</th>
                  <th className="p-4 font-medium">Time</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {summary.recentThreats.map((threat) => (
                  <tr key={threat.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 font-mono text-gray-300">{threat.sender}</td>
                    <td className="p-4 text-gray-400 truncate max-w-[200px]">{threat.subject}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-neon-red" 
                            style={{ width: `${threat.score * 100}%` }}
                          />
                        </div>
                        <span className="text-neon-red font-mono text-xs">{(threat.score * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{formatRelative(threat.time)}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                        {threat.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && summary.recentThreats.length === 0 && (
              <div className="p-6 text-sm text-gray-500">No phishing emails detected yet. Connect Gmail and start scanning to populate this table.</div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon,
  isLoading,
}: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  isLoading: boolean;
}) => {
  const isUp = trend === 'up';
  const isPositive = title === 'False Positive Rate' || title === 'Avg Processing Time' ? !isUp : isUp;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors min-h-[140px]"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-colors" />
      
      {isLoading ? (
        <div className="animate-pulse flex flex-col h-full justify-between relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-white/5 rounded-lg"></div>
            <div className="w-16 h-6 bg-white/5 rounded-full"></div>
          </div>
          <div>
            <div className="w-24 h-8 bg-white/5 rounded mb-2"></div>
            <div className="w-32 h-4 bg-white/5 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="p-2 bg-[#111] border border-white/5 rounded-lg">
              {icon}
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              isPositive ? 'text-neon-green bg-neon-green/10' : 'text-neon-red bg-neon-red/10'
            }`}>
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {change}
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-3xl font-display font-bold text-white mb-1">{value}</h3>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </>
      )}
    </motion.div>
  );
};
