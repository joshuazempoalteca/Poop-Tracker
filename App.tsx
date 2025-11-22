import React, { useState, useEffect, useRef } from 'react';
import { Plus, BarChart2, List, UserCircle2, Undo2, X, Users } from 'lucide-react';
import { LogForm } from './components/LogForm';
import { HistoryList } from './components/HistoryList';
import { StatsDashboard } from './components/StatsDashboard';
import { UserProfile } from './components/UserProfile';
import { Auth } from './components/Auth';
import { FriendFeed } from './components/FriendFeed';
import { getLogs, saveLog, deleteLog } from './services/storageService';
import { getCurrentUser, logoutUser } from './services/authService';
import { PoopLog, User } from './types';
import { calculateXP } from './services/gamificationService';

enum View {
  LOG = 'LOG',
  HISTORY = 'HISTORY',
  STATS = 'STATS',
  FRIENDS = 'FRIENDS',
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.HISTORY);
  const [logs, setLogs] = useState<PoopLog[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Undo State
  const [undoLog, setUndoLog] = useState<PoopLog | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Auth Check
    const currentUser = getCurrentUser();
    if (currentUser) {
        // Ensure XP initialized if older account
        if (currentUser.xp === undefined) currentUser.xp = 0;
        if (currentUser.isAiEnabled === undefined) currentUser.isAiEnabled = true;
        // Ensure social fields exist
        if (!currentUser.id) currentUser.id = crypto.randomUUID();
        if (!currentUser.friends) currentUser.friends = [];
        
        setUser(currentUser);
    }

    // Load Logs
    setLogs(getLogs());
    
    // Dark Mode Check
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  const handleLogin = (newUser: User) => {
      if (newUser.isAiEnabled === undefined) newUser.isAiEnabled = true;
      setUser(newUser);
  };

  const handleLogout = () => {
      logoutUser();
      setUser(null);
      setIsProfileOpen(false);
  };

  const handleUserUpdate = (updatedUser: User) => {
      setUser(updatedUser);
      localStorage.setItem('doodoo_user_v1', JSON.stringify(updatedUser));
  };

  const handleSave = (log: PoopLog) => {
    // Calculate XP
    const xpGained = calculateXP({
        type: log.type,
        size: log.size,
        hasBlood: log.hasBlood,
        weight: log.weight
    });

    // Update log with final XP
    const finalLog = { ...log, xpGained };

    // Update User XP
    if (user) {
        const newUser = { ...user, xp: (user.xp || 0) + xpGained };
        handleUserUpdate(newUser);
    }

    const updated = saveLog(finalLog);
    setLogs(updated);
    setView(View.HISTORY);
  };

  const handleDelete = (id: string) => {
    const logToRemove = logs.find(l => l.id === id);
    if (!logToRemove) return;

    const updated = deleteLog(id);
    setLogs(updated);

    setUndoLog(logToRemove);
    setShowToast(true);

    if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
        setShowToast(false);
        setUndoLog(null);
    }, 5000);
  };

  const handleUndo = () => {
      if (undoLog) {
          const updated = saveLog(undoLog);
          setLogs(updated);
          closeToast();
      }
  };

  const closeToast = () => {
      setShowToast(false);
      setUndoLog(null);
      if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
      }
  };

  if (!user) {
      return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 pb-20 max-w-md mx-auto border-x border-stone-200 dark:border-stone-800 shadow-2xl relative transition-colors duration-300">
      
      <UserProfile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        logs={logs}
        onUpdateUser={handleUserUpdate}
      />

      {/* Header */}
      <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 border-b border-brown-100 dark:border-stone-800 flex justify-between items-center transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💩</span>
          <h1 className="text-xl font-bold text-brown-900 dark:text-stone-100 tracking-tight">DooDoo Log</h1>
        </div>
        <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-8 h-8 rounded-full bg-brown-100 dark:bg-stone-800 flex items-center justify-center text-brown-600 dark:text-stone-400 hover:bg-brown-200 dark:hover:bg-stone-700 transition-colors ring-2 ring-transparent hover:ring-brown-200"
        >
            <UserCircle2 className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {view === View.LOG && (
          <LogForm 
            onSave={handleSave} 
            onCancel={() => setView(View.HISTORY)} 
            aiEnabled={user?.isAiEnabled ?? true}
          />
        )}

        {view === View.HISTORY && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-brown-800 dark:text-stone-200">Recent Movements</h2>
            </div>
            <HistoryList logs={logs} onDelete={handleDelete} />
          </>
        )}

        {view === View.STATS && (
          <>
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-brown-800 dark:text-stone-200">Statistics</h2>
            </div>
            <StatsDashboard logs={logs} />
          </>
        )}

        {view === View.FRIENDS && (
            <FriendFeed currentUser={user} onUpdateUser={handleUserUpdate} />
        )}
      </main>

      {/* Toast Notification for Undo */}
      {showToast && (
          <div className="absolute bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-300">
              <div className="bg-brown-800 dark:bg-stone-800 text-white dark:text-stone-100 p-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-transparent dark:border-stone-700">
                  <span className="text-sm font-medium">Log deleted.</span>
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={handleUndo}
                        className="text-amber-300 hover:text-amber-200 font-bold text-sm flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-brown-700 dark:hover:bg-stone-700 transition-colors"
                      >
                          <Undo2 className="w-4 h-4" />
                          Undo
                      </button>
                      <button 
                        onClick={closeToast}
                        className="text-brown-400 hover:text-white p-1 rounded-full hover:bg-brown-700 dark:hover:bg-stone-700"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Floating Action Button - ONLY SHOW ON HISTORY VIEW */}
      {view === View.HISTORY && (
        <div className="absolute bottom-24 right-6 z-20">
          <button
            onClick={() => setView(View.LOG)}
            className="bg-brown-600 hover:bg-brown-700 dark:bg-brown-500 dark:hover:bg-brown-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-105 ring-4 ring-stone-50 dark:ring-stone-950"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-brown-100 dark:border-stone-800 px-4 py-3 z-30 max-w-md mx-auto transition-colors duration-300">
        <div className="flex justify-between items-center px-2">
          <button
            onClick={() => setView(View.HISTORY)}
            className={`flex flex-col items-center gap-1 ${
              view === View.HISTORY ? 'text-brown-700 dark:text-stone-200' : 'text-brown-300 dark:text-stone-600 hover:text-brown-500 dark:hover:text-stone-400'
            }`}
          >
            <List className="w-6 h-6" />
            <span className="text-[10px] font-medium">History</span>
          </button>
          
          <button
            onClick={() => setView(View.STATS)}
            className={`flex flex-col items-center gap-1 ${
              view === View.STATS ? 'text-brown-700 dark:text-stone-200' : 'text-brown-300 dark:text-stone-600 hover:text-brown-500 dark:hover:text-stone-400'
            }`}
          >
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>

          <button
            onClick={() => setView(View.FRIENDS)}
            className={`flex flex-col items-center gap-1 ${
              view === View.FRIENDS ? 'text-brown-700 dark:text-stone-200' : 'text-brown-300 dark:text-stone-600 hover:text-brown-500 dark:hover:text-stone-400'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-medium">Friends</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;