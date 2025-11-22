import React, { useState } from 'react';
import { User } from '../types';
import { loginUser } from '../services/authService';
import { AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (): boolean => {
    // Username: Alphanumeric and underscores only, 3-20 chars
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, or underscores.');
      return false;
    }

    // Email: Simple standard regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (validate()) {
      const user = loginUser(username, email);
      // Initialize default XP/Level for new login session if not present
      if (user.xp === undefined) user.xp = 0;
      if (user.level === undefined) user.level = 1;
      onLogin(user);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
      <div className="text-6xl mb-6 animate-bounce">💩</div>
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800">
        <h1 className="text-3xl font-bold text-center text-brown-900 dark:text-brown-100 mb-2">DooDoo Log</h1>
        <p className="text-center text-brown-500 dark:text-stone-400 mb-8">Track, analyze, and share your movements.</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-sm flex items-start gap-2">
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
          
          <div>
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

          <button 
            type="submit"
            className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg mt-4"
          >
            Start Logging
          </button>
        </form>
      </div>
    </div>
  );
};