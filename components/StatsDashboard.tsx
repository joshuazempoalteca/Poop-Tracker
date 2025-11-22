import React, { useMemo } from 'react';
import { PoopLog } from '../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Zap } from 'lucide-react';

interface StatsDashboardProps {
  logs: PoopLog[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs }) => {
  const stats = useMemo(() => {
    const typeCounts = Array(8).fill(0); // Index 1-7
    logs.forEach(l => {
      if(l.type >= 1 && l.type <= 7) {
        typeCounts[l.type]++;
      }
    });
    
    return [1, 2, 3, 4, 5, 6, 7].map(type => ({
      name: `T${type}`,
      count: typeCounts[type],
      color: type === 3 || type === 4 ? '#8a6a5c' : '#d2bab0' // Highlight healthy
    }));
  }, [logs]);

  const durationStats = useMemo(() => {
    const bins = [
      { name: '<5m', min: 0, max: 5, count: 0 },
      { name: '5-10m', min: 5, max: 10, count: 0 },
      { name: '10-15m', min: 10, max: 15, count: 0 },
      { name: '15m+', min: 15, max: 999, count: 0 },
    ];

    logs.forEach(l => {
      if (l.durationMinutes) {
        const bin = bins.find(b => l.durationMinutes! >= b.min && l.durationMinutes! < b.max);
        if (bin) bin.count++;
      }
    });

    return bins;
  }, [logs]);

  const xpHistory = useMemo(() => {
      const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);
      let cumulative = 0;
      return sorted.map(log => {
          cumulative += (log.xpGained || 0);
          return {
              date: new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              xp: cumulative
          };
      });
  }, [logs]);

  const totalPoops = logs.length;
  
  // Calculate Average Duration Per Day
  const avgDurationPerDay = useMemo(() => {
    if (logs.length === 0) return "N/A";

    // Group durations by day (YYYY-MM-DD)
    const durationByDay: Record<string, number> = {};
    
    logs.forEach(log => {
      if (log.durationMinutes) {
        const dateKey = new Date(log.timestamp).toLocaleDateString();
        durationByDay[dateKey] = (durationByDay[dateKey] || 0) + log.durationMinutes;
      }
    });

    const daysWithDuration = Object.keys(durationByDay).length;
    if (daysWithDuration === 0) return "0m";

    const totalDuration = Object.values(durationByDay).reduce((a, b) => a + b, 0);
    const avg = totalDuration / daysWithDuration;
    
    return `${Math.round(avg)}m`;
  }, [logs]);

  // Calculate Average Type
  const avgType = useMemo(() => {
    if (logs.length === 0) return "N/A";
    const total = logs.reduce((sum, log) => sum + log.type, 0);
    return (total / logs.length).toFixed(1);
  }, [logs]);

  const avgTypeLabel = useMemo(() => {
      if (avgType === "N/A") return "";
      const num = parseFloat(avgType);
      if (num < 3) return "Constipated";
      if (num <= 5) return "Ideal";
      return "Loose";
  }, [avgType]);

  if (logs.length === 0) {
    return <div className="p-8 text-center text-brown-400 dark:text-stone-500">Log some data to see stats!</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800">
          <div className="text-sm text-brown-500 dark:text-stone-400">Total Logs</div>
          <div className="text-3xl font-bold text-brown-900 dark:text-stone-100">{totalPoops}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800">
           <div className="text-sm text-brown-500 dark:text-stone-400">Time / Day</div>
           <div className="text-3xl font-bold text-brown-900 dark:text-stone-100">{avgDurationPerDay}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 col-span-2 md:col-span-1">
           <div className="text-sm text-brown-500 dark:text-stone-400">Avg Type</div>
           <div className="flex items-baseline gap-2">
             <span className="text-3xl font-bold text-brown-900 dark:text-stone-100">{avgType}</span>
             <span className="text-xs px-2 py-1 rounded-full bg-brown-50 dark:bg-stone-800 text-brown-600 dark:text-stone-300 font-medium">{avgTypeLabel}</span>
           </div>
        </div>
      </div>

      {/* XP Growth Chart */}
      {xpHistory.length > 0 && (
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 h-64">
            <h3 className="text-brown-800 dark:text-stone-200 font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                XP Growth
            </h3>
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={xpHistory} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0cec7" opacity={0.3} />
                <XAxis dataKey="date" tick={{fill: '#8a6a5c', fontSize: 10}} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fill: '#8a6a5c', fontSize: 10}} axisLine={false} tickLine={false} width={30} />
                <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#000'}}
                />
                <Line type="monotone" dataKey="xp" stroke="#d97706" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#d97706' }} />
            </LineChart>
            </ResponsiveContainer>
        </div>
      )}

      {/* Type Chart */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 h-64">
        <h3 className="text-brown-800 dark:text-stone-200 font-semibold mb-4">Type Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
            <XAxis dataKey="name" tick={{fill: '#8a6a5c'}} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip 
              cursor={{fill: 'transparent'}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#000'}}
              itemStyle={{color: '#5d453b'}}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Duration Chart */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 h-64">
        <h3 className="text-brown-800 dark:text-stone-200 font-semibold mb-4">Time Spent (Minutes)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={durationStats} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0cec7" opacity={0.5} />
            <XAxis dataKey="name" tick={{fill: '#8a6a5c', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
            <YAxis tick={{fill: '#8a6a5c', fontSize: 12}} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: '#f2e8e5', opacity: 0.4}}
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#ffffff', color: '#000'}}
            />
            <Bar dataKey="count" fill="#a18072" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-sm text-brown-800 dark:text-amber-100 border border-amber-100 dark:border-amber-900/30">
          <strong>Did you know?</strong> Types 3 and 4 are generally considered the "Gold Standard" of bowel health!
      </div>
    </div>
  );
};