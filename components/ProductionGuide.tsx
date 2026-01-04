
import React from 'react';
import { Database, ShieldCheck, Zap, Globe, Github, Server, Lock, Cpu, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface ProductionGuideProps {
  onOpenLegal?: () => void;
}

export const ProductionGuide: React.FC<ProductionGuideProps> = ({ onOpenLegal }) => {
  const steps = [
    {
      title: "Replace LocalStorage with Supabase",
      icon: <Database className="w-5 h-5 text-blue-500" />,
      desc: "Currently data is lost if a user clears their browser. Supabase provides a real PostgreSQL DB + Realtime social features.",
      status: "Priority: High"
    },
    {
      title: "Server-Side AI Proxying",
      icon: <Cpu className="w-5 h-5 text-green-500" />,
      desc: "Your API Key is currently exposed in the frontend. Move Gemini calls to a Vercel Edge Function or Node server for security.",
      status: "Security Risk"
    },
    {
      title: "Clerk or Firebase Auth",
      icon: <Lock className="w-5 h-5 text-purple-500" />,
      desc: "Replace the 'Auth.tsx' simulation with Clerk. It handles real email verification, OAuth (Google/Apple), and MFA out of the box.",
      status: "Standard"
    },
    {
      title: "HIPAA & Privacy Audit",
      icon: <ShieldCheck className="w-5 h-5 text-red-500" />,
      desc: "Poop data is health data. You must implement end-to-end encryption and a strict Privacy Policy to launch on App Stores.",
      status: "Legal",
      action: onOpenLegal,
      actionText: "Review Drafts"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-brown-900 text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <RocketIcon className="w-8 h-8 text-amber-400" />
          <h2 className="text-xl font-bold">Launch Roadmap</h2>
        </div>
        <p className="text-brown-300 text-sm">Convert this prototype into a multi-user production app.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-brown-100 dark:border-stone-800 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-stone-50 dark:bg-stone-800 rounded-lg">
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-brown-900 dark:text-stone-200 text-sm">{step.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.status.includes('Risk') ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-500'}`}>
                    {step.status}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-2">{step.desc}</p>
                {step.action && (
                    <button 
                        onClick={step.action}
                        className="text-[10px] font-bold text-brown-600 hover:text-brown-700 flex items-center gap-1 uppercase tracking-wider"
                    >
                        {step.actionText} <ExternalLink className="w-3 h-3" />
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold mb-2">
          <Zap className="w-4 h-4" />
          <span>Recommended Stack</span>
        </div>
        <ul className="text-xs space-y-2 text-amber-700 dark:text-amber-300">
          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> <strong>Frontend:</strong> Next.js + Tailwind</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> <strong>Backend:</strong> Supabase (Postgres + Auth)</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> <strong>Hosting:</strong> Vercel</li>
          <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> <strong>AI:</strong> Vercel AI SDK</li>
        </ul>
      </div>

      <a 
        href="https://supabase.com" 
        target="_blank" 
        className="block w-full py-4 bg-brown-600 hover:bg-brown-700 text-white text-center font-bold rounded-xl shadow-lg transition-transform active:scale-95"
      >
        Start Building for Real
      </a>
    </div>
  );
};

const RocketIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.71-2.13.09-2.91a2.18 2.18 0 0 0-3.09-.09Z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/></svg>
);
