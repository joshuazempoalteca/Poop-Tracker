import React, { useState } from 'react';
import { User } from '../types';
import { loginSession, registerUser, verifyCredentials, recoverUsername, sendTwoFactorCode, verifyTwoFactorCode, getRememberedUsername, initiatePasswordReset, confirmPasswordReset } from '../services/authService';
import { AlertCircle, CheckCircle2, ShieldCheck, Mail, Smartphone, ArrowLeft, KeyRound, Lock, Send, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_USERNAME' | 'FORGOT_PASSWORD' | 'TWO_FACTOR';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  
  // Form Fields
  const [username, setUsername] = useState(() => getRememberedUsername() || '');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Reset Password Fields
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1); // 1 = Email, 2 = Code+NewPass

  // Preferences
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedUsername());
  const [enable2FA, setEnable2FA] = useState(false);
  
  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Temporary storage for 2FA flow
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setPassword('');
    setResetCode('');
    setNewPassword('');
    setResetStep(1);
    // Keep username if present
  };

  const validateRegister = (): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError('Username must be 3-20 characters (letters, numbers, underscores).');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (enable2FA && !phoneNumber) {
        setError('Phone number is required for 2FA.');
        return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    
    setIsLoading(true);
    try {
      const user = registerUser(username, email, password, phoneNumber, enable2FA);
      loginSession(user, false);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = verifyCredentials(username, password);
      
      if (user.isTwoFactorEnabled) {
          setPendingUser(user);
          await sendTwoFactorCode(user);
          setSuccessMsg(`Code sent to ${user.phoneNumber}`);
          setMode('TWO_FACTOR');
      } else {
          loginSession(user, rememberMe);
          onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
          const isValid = await verifyTwoFactorCode(twoFactorCode);
          if (isValid && pendingUser) {
              loginSession(pendingUser, rememberMe);
              onLogin(pendingUser);
          } else {
              setError("Invalid code. Try 123456 (Mock).");
          }
      } catch (err) {
          setError("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
        setError("Please enter your email.");
        return;
    }
    setIsLoading(true);
    try {
        const msg = await recoverUsername(email);
        setSuccessMsg(msg);
        setError(null);
    } catch (err: any) {
        setError(err.message);
        setSuccessMsg(null);
    } finally {
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
          if (resetStep === 1) {
              // Send Code
              const msg = await initiatePasswordReset(email);
              setSuccessMsg(msg);
              setResetStep(2);
          } else {
              // Confirm Reset
              if (newPassword.length < 6) {
                  throw new Error("New password must be at least 6 characters.");
              }
              const msg = await confirmPasswordReset(email, resetCode, newPassword);
              setSuccessMsg(msg);
              setTimeout(() => {
                  setMode('LOGIN');
                  resetForm();
                  setSuccessMsg("Password reset! Please log in.");
              }, 1500);
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  // --- RENDER HELPERS ---

  if (mode === 'TWO_FACTOR') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800">
                <div className="flex justify-center mb-4">
                    <ShieldCheck className="w-12 h-12 text-brown-600 dark:text-brown-400" />
                </div>
                <h2 className="text-xl font-bold text-center text-brown-900 dark:text-stone-100 mb-2">Two-Factor Auth</h2>
                <p className="text-center text-brown-500 dark:text-stone-400 text-sm mb-6">
                    Enter the code sent to your device.
                </p>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
                <form onSubmit={handleVerify2FA} className="space-y-4">
                    <input 
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        className="w-full p-3 text-center text-2xl tracking-widest font-mono rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
                        placeholder="000000"
                        maxLength={6}
                    />
                     <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </button>
                    <button type="button" onClick={() => setMode('LOGIN')} className="w-full py-2 text-stone-400 hover:text-stone-600 text-sm">Back to Login</button>
                </form>
            </div>
        </div>
      );
  }

  if (mode === 'FORGOT_USERNAME') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800">
                <button onClick={() => setMode('LOGIN')} className="mb-4 text-brown-500 hover:text-brown-700 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                <h2 className="text-xl font-bold text-brown-900 dark:text-stone-100 mb-2">Forgot Username?</h2>
                <p className="text-brown-500 dark:text-stone-400 text-sm mb-6">We'll email your username to you.</p>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
                {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-xs">{successMsg}</div>}
                <form onSubmit={handleForgotUsername} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="you@example.com" />
                    </div>
                     <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                        {isLoading ? 'Sending...' : 'Send Recovery Email'}
                    </button>
                </form>
            </div>
        </div>
    );
  }

  if (mode === 'FORGOT_PASSWORD') {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800">
                <button onClick={() => { setMode('LOGIN'); resetForm(); }} className="mb-4 text-brown-500 hover:text-brown-700 flex items-center gap-1 text-sm"><ArrowLeft className="w-4 h-4" /> Back</button>
                <h2 className="text-xl font-bold text-brown-900 dark:text-stone-100 mb-2">Reset Password</h2>
                <p className="text-brown-500 dark:text-stone-400 text-sm mb-6">
                    {resetStep === 1 ? "Enter your email to receive a reset code." : "Enter the code and your new password."}
                </p>
                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
                {successMsg && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-xs">{successMsg}</div>}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                     {resetStep === 1 && (
                         <div>
                            <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="you@example.com" />
                            </div>
                        </div>
                     )}

                     {resetStep === 2 && (
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <div>
                                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Reset Code</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input type="text" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="123456" />
                                </div>
                                <p className="text-[10px] text-stone-400 mt-1">Mock Code: 123456</p>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">New Password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="••••••" />
                                </div>
                             </div>
                         </div>
                     )}

                     <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (resetStep === 1 ? <Send className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />)}
                        {isLoading ? 'Processing...' : (resetStep === 1 ? 'Send Code' : 'Reset Password')}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // --- LOGIN & REGISTER VIEW ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950">
      <div className="text-6xl mb-6 animate-bounce">💩</div>
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800 transition-all">
        
        <div className="flex gap-4 mb-8 border-b border-brown-100 dark:border-stone-800 pb-2">
            <button onClick={() => { setMode('LOGIN'); resetForm(); }} className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'LOGIN' ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600' : 'text-stone-400 hover:text-stone-600'}`}>Sign In</button>
            <button onClick={() => { setMode('REGISTER'); resetForm(); }} className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'REGISTER' ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600' : 'text-stone-400 hover:text-stone-600'}`}>Sign Up</button>
        </div>

        <h1 className="text-2xl font-bold text-center text-brown-900 dark:text-brown-100 mb-2">{mode === 'LOGIN' ? 'Welcome Back!' : 'Join the Movement'}</h1>
        <p className="text-center text-brown-500 dark:text-stone-400 mb-6 text-sm">{mode === 'LOGIN' ? 'Your history is waiting for you.' : 'Track, analyze, and share your bowel health.'}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start gap-2 animate-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={mode === 'LOGIN' ? handleLoginStart : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="PoopKing123" />
          </div>

          <div className="relative">
            <div className="flex justify-between">
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Password</label>
                {mode === 'LOGIN' && (
                    <div className="flex gap-2">
                         <button type="button" onClick={() => setMode('FORGOT_USERNAME')} className="text-[10px] text-brown-500 hover:text-brown-700 dark:text-stone-500 dark:hover:text-stone-300">User?</button>
                         <span className="text-[10px] text-stone-300">|</span>
                         <button type="button" onClick={() => setMode('FORGOT_PASSWORD')} className="text-[10px] text-brown-500 hover:text-brown-700 dark:text-stone-500 dark:hover:text-stone-300">Pass?</button>
                    </div>
                )}
            </div>
            <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="••••••" />
            </div>
          </div>
          
          {mode === 'REGISTER' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                    <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="you@example.com" />
                    </div>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                    <label className="flex items-center justify-between cursor-pointer mb-2">
                        <span className="text-sm font-medium text-brown-800 dark:text-stone-300 flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-green-600" /> Enable SMS 2FA?
                        </span>
                        <input type="checkbox" checked={enable2FA} onChange={(e) => setEnable2FA(e.target.checked)} className="accent-brown-600 w-4 h-4" />
                    </label>
                    {enable2FA && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                            <label className="block text-xs text-stone-500 mb-1">Phone Number</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input type="tel" required={enable2FA} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-brown-200 dark:border-stone-700 bg-white dark:bg-stone-900 outline-none focus:ring-1 focus:ring-brown-500" placeholder="+1 555-0199" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
          )}

          {mode === 'LOGIN' && (
              <div className="flex items-center gap-2">
                  <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-brown-600 w-4 h-4"/>
                  <label htmlFor="rememberMe" className="text-sm text-brown-600 dark:text-stone-400 cursor-pointer">Remember me</label>
              </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-70">
            {isLoading ? 'Processing...' : (mode === 'LOGIN' ? 'Log In' : 'Create Account')}
            {!isLoading && <CheckCircle2 className="w-5 h-5 opacity-50" />}
          </button>
        </form>
      </div>
    </div>
  );
};