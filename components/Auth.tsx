
import React, { useState } from 'react';
import { User } from '../types';
import { loginSession, registerUser, verifyCredentials, recoverUsername, sendTwoFactorCode, verifyTwoFactorCode, getRememberedUsername, initiatePasswordReset, confirmPasswordReset } from '../services/authService';
import { AlertCircle, CheckCircle2, ShieldCheck, Mail, Smartphone, ArrowLeft, KeyRound, Lock, Send, Loader2, Info, Inbox } from 'lucide-react';

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
  const [resetStep, setResetStep] = useState<1 | 2>(1); 

  // Preferences
  const [rememberMe, setRememberMe] = useState(() => !!getRememberedUsername());
  const [enable2FA, setEnable2FA] = useState(false);
  
  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulatedInbox, setShowSimulatedInbox] = useState(false);
  
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
    setShowSimulatedInbox(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setShowSimulatedInbox(true);
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
              setError("Invalid code. Use 123456 for the demo.");
          }
      } catch (err) {
          setError("Verification failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const msg = await recoverUsername(email);
        setSuccessMsg(msg);
        setError(null);
        setShowSimulatedInbox(true);
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
              const msg = await initiatePasswordReset(email);
              setSuccessMsg(msg);
              setResetStep(2);
              setShowSimulatedInbox(true);
          } else {
              const msg = await confirmPasswordReset(email, resetCode, newPassword);
              setSuccessMsg(msg);
              setTimeout(() => {
                  setMode('LOGIN');
                  resetForm();
                  setSuccessMsg("Password reset! Log in with your new password.");
              }, 1500);
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-stone-950 relative overflow-hidden">
      
      {/* Simulation Banner */}
      <div className="absolute top-0 left-0 right-0 bg-amber-100 dark:bg-amber-900/30 py-2 px-4 flex items-center justify-center gap-2 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-widest z-50">
          <Info className="w-3 h-3" />
          Prototype Environment: No real emails are sent.
      </div>

      {/* Simulated Email Modal Overlay */}
      {showSimulatedInbox && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none p-4 pb-20 sm:pb-4">
              <div className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border-2 border-brown-200 dark:border-brown-800 pointer-events-auto animate-in slide-in-from-bottom-10">
                  <div className="bg-brown-600 p-3 rounded-t-xl flex justify-between items-center">
                      <div className="flex items-center gap-2 text-white">
                          <Inbox className="w-4 h-4" />
                          <span className="text-xs font-bold">Simulated Inbox</span>
                      </div>
                      <button onClick={() => setShowSimulatedInbox(false)} className="text-white/70 hover:text-white">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="p-4 space-y-2">
                      <div className="border-b border-stone-100 dark:border-stone-700 pb-2">
                          <p className="text-[10px] text-stone-400">From: DooDoo Log Support</p>
                          <p className="text-xs font-bold text-stone-700 dark:text-stone-200">Security Verification Required</p>
                      </div>
                      <p className="text-sm text-stone-600 dark:text-stone-400 py-2">
                          Hello! Use the following code to verify your identity:
                      </p>
                      <div className="bg-stone-100 dark:bg-stone-900 p-3 rounded-lg text-center font-mono text-2xl font-bold tracking-[0.5em] text-brown-600 dark:text-brown-400">
                          123456
                      </div>
                      <button 
                        onClick={() => {
                            if (mode === 'TWO_FACTOR') setTwoFactorCode('123456');
                            if (mode === 'FORGOT_PASSWORD') setResetCode('123456');
                            setShowSimulatedInbox(false);
                        }}
                        className="w-full mt-2 py-2 text-xs font-bold text-brown-600 hover:text-brown-700 underline"
                      >
                          Auto-fill code for me
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="text-6xl mb-6 animate-bounce">💩</div>
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl border border-brown-100 dark:border-stone-800 transition-all relative">
        
        {/* Navigation / Back Button */}
        {(mode !== 'LOGIN' && mode !== 'REGISTER') && (
            <button onClick={() => { setMode('LOGIN'); resetForm(); }} className="absolute top-8 left-8 text-stone-400 hover:text-brown-600">
                <ArrowLeft className="w-5 h-5" />
            </button>
        )}

        <div className="flex gap-4 mb-8 border-b border-brown-100 dark:border-stone-800 pb-2 pt-2">
            {(mode === 'LOGIN' || mode === 'REGISTER') ? (
                <>
                    <button onClick={() => { setMode('LOGIN'); resetForm(); }} className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'LOGIN' ? 'text-brown-600 border-b-2 border-brown-600' : 'text-stone-400'}`}>Sign In</button>
                    <button onClick={() => { setMode('REGISTER'); resetForm(); }} className={`flex-1 pb-2 text-center font-bold text-sm transition-colors ${mode === 'REGISTER' ? 'text-brown-600 border-b-2 border-brown-600' : 'text-stone-400'}`}>Sign Up</button>
                </>
            ) : (
                <div className="w-full text-center pb-2 text-xs font-bold text-brown-500 uppercase tracking-widest">
                    {mode.replace('_', ' ')}
                </div>
            )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-[11px] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-300 text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* --- FORM MODES --- */}
        
        {mode === 'LOGIN' && (
            <form onSubmit={handleLoginStart} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Username</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="Username" />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-stone-500 uppercase">Password</label>
                        <button type="button" onClick={() => setMode('FORGOT_PASSWORD')} className="text-[10px] text-brown-500 hover:underline">Forgot?</button>
                    </div>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-9 pr-3 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none" placeholder="••••••" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="accent-brown-600"/>
                    <label htmlFor="rememberMe" className="text-xs text-stone-500 cursor-pointer">Remember me</label>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-70">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Log In'}
                </button>
            </form>
        )}

        {mode === 'REGISTER' && (
            <form onSubmit={handleRegister} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Choose Username</label>
                    <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="e.g. PoopMaster" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="you@example.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Create Password</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="••••••" />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-70">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create My Account'}
                </button>
            </form>
        )}

        {mode === 'FORGOT_PASSWORD' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetStep === 1 ? (
                    <>
                        <p className="text-xs text-stone-500 text-center mb-4">We'll send a 6-digit code to your registered email to reset your password.</p>
                        <div>
                            <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Registered Email</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="you@example.com" />
                        </div>
                    </>
                ) : (
                    <>
                         <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                             <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-stone-500 uppercase">Verification Code</label>
                                    <button type="button" onClick={() => setShowSimulatedInbox(true)} className="text-[10px] text-brown-500 flex items-center gap-1">
                                        <Inbox className="w-3 h-3" /> View Inbox
                                    </button>
                                </div>
                                <input type="text" required value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full p-3 text-center tracking-widest text-lg font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="123456" />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">New Password</label>
                                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="Min 6 characters" />
                             </div>
                         </div>
                    </>
                )}
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (resetStep === 1 ? 'Send Reset Code' : 'Update Password')}
                </button>
            </form>
        )}

        {mode === 'TWO_FACTOR' && (
            <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="flex justify-center mb-2">
                    <ShieldCheck className="w-12 h-12 text-brown-500" />
                </div>
                <p className="text-xs text-stone-500 text-center mb-4">Confirm your identity with the code we sent.</p>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-stone-500 uppercase">Verification Code</label>
                        <button type="button" onClick={() => setShowSimulatedInbox(true)} className="text-[10px] text-brown-500 flex items-center gap-1">
                            <Inbox className="w-3 h-3" /> View Inbox
                        </button>
                    </div>
                    <input type="text" required value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} className="w-full p-3 text-center tracking-widest text-lg font-bold rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 outline-none" placeholder="000000" maxLength={6}/>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-4 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-xl shadow-lg disabled:opacity-70">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Sign In'}
                </button>
            </form>
        )}

      </div>
    </div>
  );
};

const X = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
