import React, { useState } from 'react';
import { User } from '../types';
import { loginUser, registerUser, getRememberedUsername } from '../services/authService';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  // Initialize from storage if available
  const [username, setUsername] = useState(() => getRememberedUsername() || '');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedUsername());
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    // Username: Alphanumeric and underscores only, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscores).');
      return false;
    }

    if (mode === 'REGISTER') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    try {
      let user: User;
      if (mode === 'REGISTER') {
        // Register creates the user in the DB
        user = registerUser(username, email);
        // Automatically log them in after register (session storage by default for safety)
        loginUser(user.username, false); 
      } else {
        user = loginUser(username, rememberMe);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
      <div className="text-6xl mb-6 animate-bounce">💩</div>
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800 transition-all">
        
        {/* Toggle Header */}
        <div className="flex gap-4 mb-8 border-b border-brown-100 dark:border-stone-800 pb-2">
            <button 
                onClick={() => { setMode('LOGIN'); setError(null); }}
                className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'LOGIN' ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600' : 'text-stone-400 hover:text-stone-600'}`}
            >
                Sign In
            </button>
            <button 
                onClick={() => { setMode('REGISTER'); setError(null); }}
                className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'REGISTER' ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600' : 'text-stone-400 hover:text-stone-600'}`}
            >
                Sign Up
            </button>
        </div>

        <h1 className="text-2xl font-bold text-center text-brown-900 dark:text-brown-100 mb-2">
            {mode === 'LOGIN' ? 'Welcome Back!' : 'Join the Movement'}
        </h1>
        <p className="text-center text-brown-500 dark:text-stone-400 mb-6 text-sm">
            {mode === 'LOGIN' ? 'Your history is waiting for you.' : 'Track, analyze, and share your bowel health.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Username</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
              placeholder="PoopKing123"
            />
          </div>
          
          {mode === 'REGISTER' && (
            <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Email</label>
                <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
                placeholder="you@example.com"
                />
            </div>
          )}

          {mode === 'LOGIN' && (
              <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-brown-600 w-4 h-4"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-brown-600 dark:text-stone-400 cursor-pointer">
                      Remember me
                  </label>
              </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg mt-4 flex items-center justify-center gap-2"
          >
            {mode === 'LOGIN' ? 'Log In' : 'Create Account'}
            <CheckCircle2 className="w-5 h-5 opacity-50" />
          </button>
        </form>
      </div>
    </div>
  );
};