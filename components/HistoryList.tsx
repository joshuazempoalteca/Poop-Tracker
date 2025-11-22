import React, { useState, useMemo } from 'react';
import { PoopLog, BristolType } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';
import { shareLog } from '../utils/shareUtils';
import { Share2, Trash2, MessageSquareQuote, Clock, Filter, ArrowUpDown, AlertTriangle, Zap, Layers, Scale, Search, Droplet, CheckSquare, Square } from 'lucide-react';

interface HistoryListProps {
  logs: PoopLog[];
  onDelete: (id: string) => void;
}

type SortOrder = 'desc' | 'asc';

export const HistoryList: React.FC<HistoryListProps> = ({ logs, onDelete }) => {
  // Filter state now holds an array of selected types. Empty means ALL.
  const [selectedTypes, setSelectedTypes] = useState<BristolType[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleShareClick = async (log: PoopLog) => {
    const result = await shareLog(log);
    if (!navigator.share) {
        alert(result);
    }
  };

  const toggleTypeFilter = (type: BristolType) => {
      setSelectedTypes(prev => 
          prev.includes(type) 
            ? prev.filter(t => t !== type) 
            : [...prev, type]
      );
  };

  const filteredLogs = useMemo(() => {
    let processed = [...logs];

    // Search Filter
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        processed = processed.filter(log => 
            (log.notes && log.notes.toLowerCase().includes(query)) ||
            (log.aiCommentary && log.aiCommentary.toLowerCase().includes(query))
        );
    }

    // Type Filter (Multi-select)
    if (selectedTypes.length > 0) {
        processed = processed.filter(log => selectedTypes.includes(log.type));
    }

    // Sort
    processed.sort((a, b) => {
        if (sortOrder === 'desc') {
            return b.timestamp - a.timestamp;
        } else {
            return a.timestamp - b.timestamp;
        }
    });

    return processed;
  }, [logs, selectedTypes, sortOrder, searchQuery]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-brown-400 dark:text-stone-500">
        <div className="text-6xl mb-4">🚽</div>
        <p>No logs yet. Nature calls!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls & Search */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-400 dark:text-stone-500" />
            <input 
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-brown-100 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm text-brown-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-brown-500/20"
            />
        </div>

        {/* Filter/Sort Toolbar */}
        <div className="flex items-center justify-between bg-white dark:bg-stone-900 p-2 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${selectedTypes.length > 0 ? 'bg-brown-100 text-brown-800 dark:bg-brown-900 dark:text-brown-200' : 'hover:bg-brown-50 dark:hover:bg-stone-800 text-brown-600 dark:text-stone-400'}`}
                >
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {selectedTypes.length === 0 ? 'All Types' : `${selectedTypes.length} Selected`}
                    </span>
                </button>
                
                <button 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="p-2 hover:bg-brown-50 dark:hover:bg-stone-800 rounded-lg text-brown-600 dark:text-stone-400 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </button>
            </div>
            <div className="text-xs text-brown-400 dark:text-stone-500 px-2">
                {filteredLogs.length} results
            </div>
        </div>
      </div>

      {/* Expanded Multi-Select Filters */}
      {showFilters && (
          <div className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-inner border border-brown-100 dark:border-stone-800 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-brown-600 dark:text-stone-400">Tap multiple to combine</span>
                  <button 
                    onClick={() => setSelectedTypes([])}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                  >
                      Clear All
                  </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                {BRISTOL_SCALE_DATA.map(d => {
                    const isSelected = selectedTypes.includes(d.type);
                    return (
                        <button
                            key={d.type}
                            onClick={() => toggleTypeFilter(d.type)}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${
                                isSelected 
                                ? 'bg-brown-600 text-white border-brown-600 shadow-md' 
                                : 'bg-stone-50 dark:bg-stone-800 border-transparent text-brown-600 dark:text-stone-400 hover:bg-brown-100 dark:hover:bg-stone-700'
                            }`}
                        >
                            <span className="text-base">{d.icon}</span>
                            <span className="font-bold">Type {d.type}</span>
                        </button>
                    );
                })}
              </div>
          </div>
      )}

      {/* Log List */}
      {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-brown-400 dark:text-stone-600 italic">
              No logs match your filter.
          </div>
      ) : (
        filteredLogs.map((log) => {
            const typeInfo = BRISTOL_SCALE_DATA.find((d) => d.type === log.type);
            const date = new Date(log.timestamp);

            return (
            <div key={log.id} className="bg-white dark:bg-stone-900 p-4 rounded-xl shadow-sm border border-brown-100 dark:border-stone-800 flex flex-col gap-3 relative overflow-hidden group">
                {/* Blood Indicator Strip */}
                {log.hasBlood && <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>}
                
                <div className="flex justify-between items-start pl-2">
                    <div className="flex gap-3">
                        <div className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl shrink-0 ${typeInfo?.color} text-white shadow-sm`}>
                        {typeInfo?.icon}
                        </div>
                        <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-brown-900 dark:text-stone-100">Type {log.type}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-brown-100 dark:bg-stone-800 text-brown-800 dark:text-stone-300 font-medium`}>
                                {typeInfo?.health}
                            </span>
                            {/* XP Badge */}
                            {log.xpGained !== undefined && (
                                <span className="text-xs font-bold text-amber-500 flex items-center">
                                    <Zap className="w-3 h-3 fill-amber-500" /> +{log.xpGained} XP
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-brown-500 dark:text-stone-500 mt-0.5">
                            <p>
                                {date.toLocaleDateString()} at {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            {/* Blood Icon Indicator */}
                            {log.hasBlood && (
                                <Droplet className="w-3 h-3 text-red-500 fill-red-500" />
                            )}
                        </div>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => handleShareClick(log)} className="p-2 text-brown-400 hover:text-brown-600 dark:text-stone-500 dark:hover:text-stone-300 hover:bg-brown-50 dark:hover:bg-stone-800 rounded-full transition-colors">
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(log.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-[3.75rem] text-xs text-brown-600 dark:text-stone-400">
                    {log.durationMinutes !== undefined && (
                        <div className="flex items-center gap-1.5" title="Duration">
                            <Clock className="w-3 h-3" />
                            <span>{log.durationMinutes}m</span>
                        </div>
                    )}
                    {log.size && (
                         <div className="flex items-center gap-1.5" title="Size">
                            <span className="font-bold">S:</span> {log.size.toLowerCase()}
                        </div>
                    )}
                     {log.weight && (
                         <div className="flex items-center gap-1.5" title="Weight">
                            <Scale className="w-3 h-3" />
                            <span>{log.weight}g</span>
                        </div>
                    )}
                     {log.wipes !== undefined && (
                        <div className="flex items-center gap-1.5" title="Number of Wipes">
                            <Layers className="w-3 h-3" />
                            <span>{log.wipes} wipes</span>
                        </div>
                    )}
                     {log.painLevel !== undefined && (
                        <div className="flex items-center gap-1.5" title="Pain Level">
                            <span className={`font-bold ${log.painLevel > 5 ? 'text-red-500' : ''}`}>Pain: {log.painLevel}</span>
                        </div>
                    )}
                </div>
                
                {/* Flags (Clog / Blood Tags) */}
                {(log.isClog || log.hasBlood) && (
                    <div className="ml-[3.75rem] flex gap-2">
                        {log.isClog && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> Clog
                            </span>
                        )}
                        {log.hasBlood && (
                            <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                <Droplet className="w-3 h-3" /> Blood
                            </span>
                        )}
                    </div>
                )}

                {/* Notes Section */}
                {log.notes && (
                <div className="text-sm text-brown-700 dark:text-stone-300 italic border-l-2 border-brown-200 dark:border-stone-700 pl-3 ml-[3.75rem]">
                    "{log.notes}"
                </div>
                )}

                {/* AI Insight Bubble */}
                {log.aiCommentary && (
                <div className="bg-brown-50 dark:bg-stone-800/50 p-3 rounded-lg flex gap-3 items-start text-sm text-brown-800 dark:text-stone-300 ml-[3.75rem]">
                    <MessageSquareQuote className="w-5 h-5 text-brown-500 dark:text-stone-500 shrink-0 mt-0.5" />
                    <p>{log.aiCommentary}</p>
                </div>
                )}
            </div>
            );
        })
      )}
    </div>
  );
};