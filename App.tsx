
import React, { useState, useEffect, useRef } from 'react';
import { Plus, BarChart2, List, UserCircle2, Undo2, X, Users, Rocket, ArrowLeft } from 'lucide-react';
import { LogForm } from './components/LogForm';
import { HistoryList } from './components/HistoryList';
import { StatsDashboard } from './components/StatsDashboard';
import { UserProfile } from './components/UserProfile';
import { Auth } from './components/Auth';
import { FriendFeed } from './components/FriendFeed';
import { ProductionGuide } from './components/ProductionGuide';
import { LegalDocs } from './components/LegalDocs';
import { getLogs, saveLog, deleteLog } from './services/storageService';
import { getCurrentUser, logoutUser, updateUserProfile, getUserById } from './services/authService';
import { PoopLog, User } from './types';
import { calculateXP } from './services/gamificationService';

enum View {
  LOG = 'LOG',
  HISTORY = 'HISTORY',
  STATS = 'STATS',
  FRIENDS = 'FRIENDS',
  PRO = 'PRO',
  LEGAL = 'LEGAL'
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>(View.HISTORY);
  const [logs, setLogs] = useState<PoopLog[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userProfileLegalTab, setUserProfileLegalTab] = useState<'TOS' | 'PRIVACY'>('PRIVACY');

  // Undo State
  const [undoLog, setUndoLog] = useState<PoopLog | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const initData = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) setUser(currentUser);

      const fetchedLogs = await getLogs();
      setLogs(fetchedLogs);
    };

    initData();

    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = storedTheme === 'dark' || (!storedTheme && prefersDark);
    setIsDarkMode(dark);
    document.documentElement.classList.toggle('dark', dark);

    const handleProfileUpdate = (e: any) => setUser(e.detail);

    // Listen for manual refetch events if we add them
    window.addEventListener('doodoo_profile_updated', handleProfileUpdate as EventListener);

    return () => {
      window.removeEventListener('doodoo_profile_updated', handleProfileUpdate as EventListener);
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handleLogin = (newUser: User) => setUser(newUser);
  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsProfileOpen(false);
  };

  const handleUserUpdate = async (updatedUser: User) => {
    setUser(updatedUser);
    await updateUserProfile(updatedUser);
  };

  const handleLogsUpdated = (newLogs: PoopLog[]) => setLogs(newLogs);

  const handleSave = async (log: PoopLog) => {
    const xpGained = calculateXP({ type: log.type, size: log.size, hasBlood: log.hasBlood, weight: log.weight });
    const finalLog = { ...log, xpGained };

    if (user) {
      const newUser = { ...user, xp: (user.xp || 0) + xpGained };
      handleUserUpdate(newUser);
    }

    const updated = await saveLog(finalLog);
    setLogs(updated);
    setView(View.HISTORY);
  };

  const handleDelete = async (id: string) => {
    const logToRemove = logs.find(l => l.id === id);
    if (!logToRemove) return;
    const updated = await deleteLog(id);
    setLogs(updated);
    setUndoLog(logToRemove);
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
      setUndoLog(null);
    }, 5000);
  };

  if (!user) return <Auth onLogin={handleLogin} />;




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
        onLogsUpdated={handleLogsUpdated}
        onOpenLegal={(tab) => {
          if (tab) setUserProfileLegalTab(tab);
          setIsProfileOpen(false);
          setView(View.LEGAL);
        }}
      />

      <header className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4 border-b border-brown-100 dark:border-stone-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {view === View.LEGAL ? (
            <button onClick={() => setView(View.PRO)} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-brown-600" />
            </button>
          ) : (
            <span className="text-2xl">💩</span>
          )}
          <h1 className="text-xl font-bold text-brown-900 dark:text-stone-100 tracking-tight">
            {view === View.LEGAL ? 'Legal Center' : 'DooDoo Log'}
          </h1>
        </div>
        <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 rounded-full bg-brown-100 dark:bg-stone-800 flex items-center justify-center text-brown-600 dark:text-stone-400">
          <UserCircle2 className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4">
        {view === View.LOG && <LogForm onSave={handleSave} onCancel={() => setView(View.HISTORY)} aiEnabled={user?.isAiEnabled ?? false} />}
        {view === View.HISTORY && <HistoryList logs={logs} onDelete={handleDelete} />}
        {view === View.STATS && <StatsDashboard logs={logs} />}
        {view === View.FRIENDS && <FriendFeed currentUser={user} onUpdateUser={handleUserUpdate} />}
        {view === View.PRO && <ProductionGuide onOpenLegal={() => setView(View.LEGAL)} />}
        {view === View.LEGAL && <LegalDocs initialTab={userProfileLegalTab} />}
      </main>

      {view === View.HISTORY && (
        <div className="absolute bottom-24 right-6 z-20">
          <button onClick={() => setView(View.LOG)} className="bg-brown-600 hover:bg-brown-700 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-105">
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-stone-900 border-t border-brown-100 dark:border-stone-800 px-2 py-3 z-30 max-w-md mx-auto">
        <div className="flex justify-between items-center px-2">
          <NavItem icon={<List />} label="History" active={view === View.HISTORY} onClick={() => setView(View.HISTORY)} />
          <NavItem icon={<BarChart2 />} label="Stats" active={view === View.STATS} onClick={() => setView(View.STATS)} />
          <NavItem icon={<Users />} label="Friends" active={view === View.FRIENDS} onClick={() => setView(View.FRIENDS)} />
          <NavItem icon={<Rocket />} label="Go Pro" active={view === View.PRO || view === View.LEGAL} onClick={() => setView(View.PRO)} color="text-amber-600" />
        </div>
      </nav>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, color }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 transition-all ${active ? (color || 'text-brown-700 dark:text-stone-200 scale-110') : 'text-stone-400 dark:text-stone-600 opacity-60'}`}>
    {React.cloneElement(icon, { className: "w-6 h-6" })}
    <span className="text-[10px] font-bold">{label}</span>
  </button>
);

export default App;
