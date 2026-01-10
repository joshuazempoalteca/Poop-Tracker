import { supabase } from '../utils/supabase';
import { PoopLog } from '../types';

export const getLogs = async (): Promise<PoopLog[]> => {
  const { data, error } = await supabase
    .from('poop_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }

  return data.map(log => ({
    id: log.id,
    timestamp: new Date(log.created_at).getTime(),
    type: log.type,
    notes: log.notes,
    durationMinutes: log.duration_minutes,
    aiCommentary: log.ai_commentary,
    painLevel: log.pain_level,
    wipes: log.wipes,
    isClog: log.is_clog,
    size: log.size,
    hasBlood: log.has_blood,
    xpGained: log.xp_gained,
    isPrivate: log.is_private
  }));
};

export const saveLog = async (log: PoopLog): Promise<PoopLog[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to save.");

  const dbLog = {
    user_id: user.id,
    created_at: new Date(log.timestamp).toISOString(),
    type: log.type,
    notes: log.notes,
    duration_minutes: log.durationMinutes,
    ai_commentary: log.aiCommentary,
    pain_level: log.painLevel,
    wipes: log.wipes,
    is_clog: log.isClog,
    size: log.size,
    has_blood: log.hasBlood,
    xp_gained: log.xpGained,
    is_private: log.isPrivate
  };

  const { error } = await supabase.from('poop_logs').insert(dbLog);
  if (error) throw error;

  return getLogs();
};

export const deleteLog = async (id: string): Promise<PoopLog[]> => {
  const { error } = await supabase.from('poop_logs').delete().eq('id', id);
  if (error) throw error;
  return getLogs();
};

export const clearAllAICommentaries = async (): Promise<PoopLog[]> => {
  // This might be expensive to run on all rows, but strict requirement.
  // Better to just update local state or only update relevant ones.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { error } = await supabase
    .from('poop_logs')
    .update({ ai_commentary: null })
    .eq('user_id', user.id);

  if (error) throw error;
  return getLogs();
};
