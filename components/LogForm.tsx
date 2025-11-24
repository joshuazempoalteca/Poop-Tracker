import React, { useState } from 'react';
import { BristolSelector } from './BristolSelector';
import { BristolType, PoopLog, PoopSize } from '../types';
import { POOP_SIZES } from '../constants';
import { generatePoopInsight } from '../services/geminiService';
import { calculateXP } from '../services/gamificationService';
import { Loader2, Save, Clock, AlertTriangle, Droplet, Zap, Calendar, Scale, Eye, EyeOff } from 'lucide-react';

interface LogFormProps {
  onSave: (log: PoopLog) => void;
  onCancel: () => void;
  aiEnabled: boolean;
}

export const LogForm: React.FC<LogFormProps> = ({ onSave, onCancel, aiEnabled }) => {
  // Basic
  const [type, setType] = useState<BristolType>(BristolType.Type4);
  const [notes, setNotes] = useState('');
  
  // Metrics
  const [duration, setDuration] = useState<string>('');
  const [wipes, setWipes] = useState<string>('');
  const [painLevel, setPainLevel] = useState<number>(0); // 0-10
  const [weight, setWeight] = useState<string>('');
  
  // Time
  const [logTime, setLogTime] = useState<string>(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:mm

  // Booleans/Enums
  const [isClog, setIsClog] = useState(false);
  const [hasBlood, setHasBlood] = useState(false);
  const [size, setSize] = useState<PoopSize>(PoopSize.Medium);
  
  // Privacy
  const [isShared, setIsShared] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const estimatedXP = calculateXP({ 
      type,
      size, 
      hasBlood,
      weight: weight ? parseFloat(weight) : undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (duration && (parseInt(duration) < 0)) {
      alert("Duration cannot be negative.");
      return;
    }
    if (wipes && (parseInt(wipes) < 0)) {
        alert("Wipes cannot be negative.");
        return;
    }
    if (weight && (parseFloat(weight) < 0)) {
        alert("Weight cannot be negative.");
        return;
    }

    let insight = '';
    const wipesCount = wipes ? parseInt(wipes) : 0;

    if (aiEnabled) {
        setIsAnalyzing(true);
        // Get AI insight
        try {
          insight = await generatePoopInsight(type, notes);
        } catch (err) {
          console.error(err);
        }

        // Wipe Logic (Clean wipe bonus msg) - Only if AI/Commentary is enabled
        let cleanWipeMsg = '';
        if (wipes && wipesCount < 5) {
            cleanWipeMsg = "That came out clean!";
        }
        
        // Append clean wipe message
        if (cleanWipeMsg) {
            insight = insight ? `${insight} ${cleanWipeMsg}` : cleanWipeMsg;
        }
    }

    const newLog: PoopLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(logTime).getTime(),
      type,
      notes,
      durationMinutes: duration ? parseInt(duration) : undefined,
      aiCommentary: insight || undefined,
      painLevel,
      wipes: wipesCount,
      isClog,
      size,
      hasBlood,
      weight: weight ? parseFloat(weight) : undefined,
      xpGained: estimatedXP,
      isPrivate: !isShared
    };

    setIsAnalyzing(false);
    onSave(newLog);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm border border-brown-100 dark:border-stone-800 transition-colors">
        
        {/* Header & XP Preview */}
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-brown-900 dark:text-stone-100">Log Movement</h2>
            <div className="bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full text-amber-800 dark:text-amber-200 font-bold text-sm flex items-center gap-1">
                <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                +{estimatedXP} XP
            </div>
        </div>
        
        <BristolSelector selected={type} onSelect={setType} />

        <div className="mt-6 space-y-6">
          
          {/* Time & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2 flex items-center gap-2">
                   <Calendar className="w-4 h-4" /> Time
                </label>
                <input 
                    type="datetime-local"
                    required
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-brown-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duration (m)
                </label>
                <input 
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
                    placeholder="0"
                />
            </div>
          </div>

          {/* Size & Weight */}
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2">Size</label>
                <div className="grid grid-cols-4 gap-2">
                    {POOP_SIZES.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setSize(s.value)}
                            className={`p-2 text-xs sm:text-sm rounded-lg border transition-colors ${size === s.value ? 'bg-brown-600 text-white border-brown-600' : 'border-brown-200 dark:border-stone-700 hover:bg-brown-50 dark:hover:bg-stone-800 text-brown-700 dark:text-stone-400'}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
             </div>
             
             <div>
                 <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2 flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Weight (grams) <span className="text-stone-400 font-normal text-xs">(Optional)</span>
                 </label>
                 <input 
                    type="number"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
                    placeholder="e.g. 150"
                />
             </div>
          </div>

          {/* Pain Scale Slider */}
          <div>
            <div className="flex justify-between mb-2">
                <label className="block text-sm font-medium text-brown-800 dark:text-stone-300">Pain Level</label>
                <span className={`text-sm font-bold ${painLevel > 5 ? 'text-red-500' : 'text-green-600'}`}>{painLevel}/10</span>
            </div>
            <input 
                type="range"
                min="0"
                max="10"
                step="1"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-stone-700 accent-brown-600"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1">
                <span>Painless</span>
                <span>Extreme</span>
            </div>
          </div>

          {/* Wipes */}
          <div>
             <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2">
               Number of Wipes
             </label>
             <input 
                type="number"
                min="0"
                value={wipes}
                onChange={(e) => setWipes(e.target.value)}
                className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 bg-brown-50 dark:bg-stone-800 text-brown-900 dark:text-stone-100 focus:ring-2 focus:ring-brown-500 outline-none"
                placeholder="e.g. 3"
             />
          </div>

          {/* Toggles (Clog & Blood) */}
          <div className="grid grid-cols-2 gap-4">
            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isClog ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700' : 'bg-brown-50 dark:bg-stone-800 border-transparent'}`}>
                <span className="text-sm font-medium text-brown-900 dark:text-stone-200 flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${isClog ? 'text-amber-600' : 'text-stone-400'}`} />
                    Clog?
                </span>
                <input type="checkbox" checked={isClog} onChange={(e) => setIsClog(e.target.checked)} className="accent-amber-600 w-5 h-5" />
            </label>

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${hasBlood ? 'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700' : 'bg-brown-50 dark:bg-stone-800 border-transparent'}`}>
                <span className="text-sm font-medium text-brown-900 dark:text-stone-200 flex items-center gap-2">
                    <Droplet className={`w-4 h-4 ${hasBlood ? 'text-red-600' : 'text-stone-400'}`} />
                    Blood?
                </span>
                <input type="checkbox" checked={hasBlood} onChange={(e) => setHasBlood(e.target.checked)} className="accent-red-600 w-5 h-5" />
            </label>
          </div>

          {/* Visibility Toggle */}
           <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-brown-800 dark:text-stone-300 flex items-center gap-2">
                            {isShared ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-stone-400" />}
                            Share with friends
                        </span>
                        <span className="text-xs text-stone-500 mt-0.5">
                            {isShared ? 'Visible on Friend Feed' : 'Private (Only you can see this)'}
                        </span>
                    </div>
                    <input type="checkbox" checked={isShared} onChange={(e) => setIsShared(e.target.checked)} className="accent-green-600 w-5 h-5" />
                </label>
           </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-brown-800 dark:text-stone-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-brown-200 dark:border-stone-700 focus:ring-2 focus:ring-brown-500 focus:border-transparent outline-none transition-all bg-brown-50 dark:bg-stone-800 dark:text-stone-100 placeholder-brown-300 dark:placeholder-stone-600"
              placeholder="How did you feel? What did you eat?"
              rows={3}
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl text-brown-700 dark:text-stone-400 font-semibold hover:bg-brown-50 dark:hover:bg-stone-800 transition-colors"
            disabled={isAnalyzing}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex-1 py-3 px-4 bg-brown-600 dark:bg-brown-600 text-white rounded-xl font-semibold shadow-lg shadow-brown-200 dark:shadow-none hover:bg-brown-700 dark:hover:bg-brown-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Log
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
