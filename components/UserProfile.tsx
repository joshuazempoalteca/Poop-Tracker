
import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, User as UserIcon, LogOut, FileDown, Bell, BellOff, Trophy, Zap, Star, Award, Bot, AlertTriangle, ShieldAlert } from 'lucide-react';
import { User, PoopLog } from '../types';
import { exportLogsToCSV } from '../utils/exportUtils';
import { calculateLevel } from '../services/gamificationService';
import { GAME_CONSTANTS } from '../constants';
import { clearAllAICommentaries } from '../services/storageService';

interface UserProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    logs: PoopLog[];
    onUpdateUser: (user: User) => void;
    onLogsUpdated: (logs: PoopLog[]) => void;
    onOpenLegal?: (tab?: 'TOS' | 'PRIVACY') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
    isOpen,
    onClose,
    user,
    onLogout,
    isDarkMode,
    toggleDarkMode,
    logs,
    onUpdateUser,
    onLogsUpdated,
    onOpenLegal
}) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [showAiConfirm, setShowAiConfirm] = useState(false);

    useEffect(() => {
        if (!('Notification' in window)) return;

        // Check user preference from local storage to allow manual disable even if permission is granted
        const storedPref = localStorage.getItem('doodoo_notifications_pref');

        if (Notification.permission === 'granted' && storedPref !== 'disabled') {
            setNotificationsEnabled(true);
        }
    }, []);

    // Reset local UI state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowAiConfirm(false);
        }
    }, [isOpen]);

    const toggleNotifications = async () => {
        if (!('Notification' in window)) {
            alert("This browser does not support desktop notifications");
            return;
        }

        if (notificationsEnabled) {
            // User explicitly turning OFF
            setNotificationsEnabled(false);
            localStorage.setItem('doodoo_notifications_pref', 'disabled');
        } else {
            // User turning ON
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    localStorage.setItem('doodoo_notifications_pref', 'enabled');
                    new Notification("DooDoo Log", { body: "Reminders enabled! We'll help you stay regular." });
                } else {
                    alert("Notifications were denied. Please enable them in your browser settings to use this feature.");
                    setNotificationsEnabled(false);
                    localStorage.setItem('doodoo_notifications_pref', 'disabled');
                }
            } catch (e) {
                console.error("Error requesting notification permission", e);
                setNotificationsEnabled(false);
            }
        }
    };

    const handlePrestige = () => {
        if (!user) return;
        // Using standard confirm for prestige as it's less frequent/critical UI flow than the toggle
        if (confirm("Are you sure you want to Prestige? Your Level and XP will reset to 0, but you will gain a Prestige Badge!")) {
            const newUser = {
                ...user,
                xp: 0,
                prestige: (user.prestige || 0) + 1
            };
            onUpdateUser(newUser);
        }
    };

    const handleToggleAI = () => {
        if (!user) return;

        const currentAiState = user.isAiEnabled === true;

        if (currentAiState) {
            // Turning OFF: Show internal confirmation view
            setShowAiConfirm(true);
        } else {
            // Turning ON: Update immediately
            onUpdateUser({ ...user, isAiEnabled: true });
        }
    };

    const confirmTurnOffAi = () => {
        if (!user) return;

        // 1. Update User State
        const updatedUser = { ...user, isAiEnabled: false };
        onUpdateUser(updatedUser);

        // 2. Clean Logs
        const cleanedLogs = clearAllAICommentaries();
        onLogsUpdated(cleanedLogs);

        // 3. Reset View
        setShowAiConfirm(false);
    };

    const cancelTurnOffAi = () => {
        setShowAiConfirm(false);
    };

    if (!isOpen) return null;

    // Calculate Level Stats
    const xp = user?.xp || 0;
    const { level, progress, nextLevelXp } = calculateLevel(xp);
    const progressPercent = Math.min(100, Math.max(0, (progress / nextLevelXp) * 100));
    const canPrestige = level >= GAME_CONSTANTS.PRESTIGE_LEVEL_REQ;

    // Safe default for AI toggle
    const isAiEnabled = user?.isAiEnabled === true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm mx-4 p-6 rounded-2xl shadow-2xl border border-brown-100 dark:border-stone-800 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">

                {showAiConfirm ? (
                    // CONFIRMATION VIEW
                    <div className="flex flex-col items-center justify-center py-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold text-brown-900 dark:text-stone-100 mb-2">Disable AI Insights?</h3>
                        <p className="text-center text-brown-600 dark:text-stone-400 mb-8 text-sm leading-relaxed">
                            This will turn off the AI features and <span className="font-bold text-red-500">permanently delete</span> all existing AI commentaries from your history.
                        </p>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={confirmTurnOffAi}
                                className="w-full py-3.5 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold shadow-lg shadow-red-200 dark:shadow-none transition-all"
                            >
                                Yes, Disable & Delete Data
                            </button>
                            <button
                                onClick={cancelTurnOffAi}
                                className="w-full py-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    // NORMAL SETTINGS VIEW
                    <>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex flex-col items-center mb-6 mt-2">
                            <div className="w-24 h-24 bg-brown-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-brown-600 dark:text-stone-400 mb-4 ring-4 ring-brown-50 dark:ring-stone-700 shadow-inner relative">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12" />
                                )}
                                <div className="absolute -bottom-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border-2 border-white dark:border-stone-900">
                                    <Trophy className="w-3 h-3" /> Lvl {level}
                                </div>
                                {user?.prestige && user.prestige > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 border-2 border-white dark:border-stone-900">
                                        <Award className="w-3 h-3" /> {user.prestige}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-brown-900 dark:text-stone-100 flex items-center gap-2">
                                {user?.username || 'Guest'}
                                {user?.prestige && user.prestige > 0 && <Award className="w-4 h-4 text-purple-500" />}
                            </h2>
                            <p className="text-brown-500 dark:text-stone-500 text-sm">{user?.email}</p>
                            {user?.id && (
                                <p className="text-stone-400 dark:text-stone-600 text-xs mt-1 font-mono select-all">
                                    #{user.id.split('-').slice(2).join('-')}
                                </p>
                            )}
                        </div>

                        {/* Level Progress Bar */}
                        <div className="mb-6 bg-stone-100 dark:bg-stone-800 p-3 rounded-xl">
                            <div className="flex justify-between text-xs mb-1 font-semibold text-brown-700 dark:text-stone-300">
                                <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-500" /> {progress} XP</span>
                                <span className="text-stone-400">Next: {nextLevelXp} XP</span>
                            </div>
                            <div className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Prestige Button */}
                        {canPrestige && (
                            <button
                                onClick={handlePrestige}
                                className="w-full mb-6 p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 animate-pulse"
                            >
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ENTER PRESTIGE MODE
                            </button>
                        )}

                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider ml-1">Settings</h3>

                            {/* Dark Mode */}
                            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? <Moon className="w-5 h-5 text-purple-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                                    <span className="font-medium text-stone-700 dark:text-stone-200">Dark Mode</span>
                                </div>
                                <button
                                    onClick={toggleDarkMode}
                                    className={`
                        w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out
                        ${isDarkMode ? 'bg-purple-600' : 'bg-stone-300'}
                    `}
                                >
                                    <div className={`
                        bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out
                        ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}
                    `} />
                                </button>
                            </div>

                            {/* AI Toggle */}
                            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                <div className="flex items-center gap-3">
                                    <Bot className="w-5 h-5 text-green-600" />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-stone-700 dark:text-stone-200">AI Insights</span>
                                        <span className="text-[10px] text-stone-500">Gemini-powered commentary</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleToggleAI}
                                    className={`
                        w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out cursor-pointer relative
                        ${isAiEnabled ? 'bg-green-600' : 'bg-stone-300'}
                    `}
                                >
                                    <div className={`
                        bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out pointer-events-none
                        ${isAiEnabled ? 'translate-x-6' : 'translate-x-0'}
                    `} />
                                </button>
                            </div>

                            {/* Notifications */}
                            <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${notificationsEnabled ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-stone-200 text-stone-400 dark:bg-stone-700'}`}>
                                        {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-stone-700 dark:text-stone-200">Reminders</span>
                                        <span className="text-[10px] text-stone-500">{notificationsEnabled ? 'Every 4 hours' : 'Disabled'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleNotifications}
                                    className={`
                        w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out
                        ${notificationsEnabled ? 'bg-blue-500' : 'bg-stone-300'}
                    `}
                                >
                                    <div className={`
                        bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ease-in-out
                        ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}
                    `} />
                                </button>
                            </div>

                            <div className="h-4"></div>

                            {/* Legal & Privacy */}
                            <button
                                onClick={onOpenLegal}
                                className="w-full flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 hover:bg-brown-50 dark:hover:bg-stone-750 transition-colors text-left"
                            >
                                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                                <span className="font-medium text-stone-700 dark:text-stone-200">Legal & Privacy</span>
                            </button>

                            {/* Export Data */}
                            <button
                                onClick={() => exportLogsToCSV(logs)}
                                className="w-full flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 hover:bg-brown-50 dark:hover:bg-stone-750 transition-colors text-left"
                            >
                                <FileDown className="w-5 h-5 text-brown-600 dark:text-stone-400" />
                                <span className="font-medium text-stone-700 dark:text-stone-200">Export Logs to CSV</span>
                            </button>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left group"
                            >
                                <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-600" />
                                <span className="font-medium text-stone-700 dark:text-stone-200 group-hover:text-red-700 dark:group-hover:text-red-400">Sign Out</span>
                            </button>

                        </div>

                        <div className="mt-6 flex justify-center gap-6 text-[11px] text-stone-400 font-medium">
                            <button onClick={() => onOpenLegal && onOpenLegal('TOS')} className="hover:text-stone-600 dark:hover:text-stone-200 hover:underline transition-colors">Terms of Service</button>
                            <button onClick={() => onOpenLegal && onOpenLegal('PRIVACY')} className="hover:text-stone-600 dark:hover:text-stone-200 hover:underline transition-colors">Privacy Policy</button>
                        </div>

                    </>
                )}
            </div>
        </div >
    );
};
