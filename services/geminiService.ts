import { supabase } from '../utils/supabase';
import { BristolType } from '../types';

export const generatePoopInsight = async (type: BristolType, notes: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-poop', {
      body: { type, notes }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      return "Great job logging! (AI offline)";
    }

    return data.message || "Good job tracking!";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    // Fallback if network fails
    return "Great job logging!";
  }
};

