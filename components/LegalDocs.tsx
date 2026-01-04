
import React, { useState } from 'react';
import { Shield, FileText, Scale, HeartPulse, Lock, Globe } from 'lucide-react';

export const LegalDocs: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'PRIVACY' | 'TOS'>('PRIVACY');

  const LastUpdated = "October 27, 2025";

  return (
    <div className="animate-in fade-in slide-in-from-right-4">
      <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mb-6">
        <button 
          onClick={() => setActiveDoc('PRIVACY')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeDoc === 'PRIVACY' ? 'bg-white dark:bg-stone-700 text-brown-800 dark:text-stone-100 shadow-sm' : 'text-stone-400'}`}
        >
          <Shield className="w-3.5 h-3.5" />
          Privacy Policy
        </button>
        <button 
          onClick={() => setActiveDoc('TOS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeDoc === 'TOS' ? 'bg-white dark:bg-stone-700 text-brown-800 dark:text-stone-100 shadow-sm' : 'text-stone-400'}`}
        >
          <Scale className="w-3.5 h-3.5" />
          Terms of Service
        </button>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-brown-100 dark:border-stone-800 p-6 shadow-sm">
        <div className="prose prose-stone dark:prose-invert prose-sm max-w-none text-stone-600 dark:text-stone-400">
          
          {activeDoc === 'PRIVACY' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brown-900 dark:text-stone-100">Privacy Policy</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400">Last Updated: {LastUpdated}</p>
              
              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> 1. Data Collection & HIPAA
                </h3>
                <p>
                  DooDoo Log collects sensitive personal health information (PHI) including bowel movement frequency, consistency (Bristol Scale), and associated physical symptoms. 
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] italic">
                  <strong>Prototype Notice:</strong> Currently, all logs are stored in your browser's local storage. We do not store PHI on our servers unless you explicitly opt-in to cloud features. For full production, we aim for HIPAA compliance using encrypted PostgreSQL instances and BAA-compliant infrastructure.
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> 2. Information Sharing
                </h3>
                <p>
                  We do not sell your health data. Information shared via the "Friends Feed" is strictly controlled by your privacy settings. You may toggle "Private Mode" on any log to exclude it from social features.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200">3. AI Processing</h3>
                <p>
                  If AI Insights are enabled, anonymized stool data and notes are processed by Google Gemini. No personally identifiable information (PII) is sent to the AI model unless explicitly written by you in the "Notes" field.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-brown-900 dark:text-stone-100">Terms of Service</h2>
              <p className="text-[10px] uppercase font-bold text-stone-400">Last Updated: {LastUpdated}</p>

              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <HeartPulse className="w-4 h-4" /> 1. Medical Disclaimer
                </h3>
                <p className="font-bold">
                  DooDoo Log is NOT a medical device. 
                </p>
                <p>
                  The content, AI insights, and statistics provided by this app are for informational purposes only. They do not constitute medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions regarding a medical condition.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200">2. User Responsibility</h3>
                <p>
                  You are responsible for maintaining the confidentiality of your account password. You agree to use the app for lawful purposes and to respect the privacy of your "Friends" within the application.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-bold text-brown-800 dark:text-stone-200">3. Data Ownership</h3>
                <p>
                  You own your health data. You may export your logs to CSV at any time or request account deletion, which will purge all associated local and (future) cloud records.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-center mt-6 text-[10px] text-stone-400">
        By using DooDoo Log, you acknowledge that you have read and agree to these drafts as part of our transition to production.
      </p>
    </div>
  );
};
