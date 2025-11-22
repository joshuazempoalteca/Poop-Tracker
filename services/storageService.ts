import { PoopLog } from '../types';

const STORAGE_KEY = 'doodoo_logs_v1';

export const getLogs = (): PoopLog[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load logs', e);
    return [];
  }
};

export const saveLog = (log: PoopLog): PoopLog[] => {
  const logs = getLogs();
  // Filter out if it already exists (update case) just in case, though ID is randomUUID usually
  const otherLogs = logs.filter(l => l.id !== log.id);
  const newLogs = [log, ...otherLogs].sort((a, b) => b.timestamp - a.timestamp); 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
  return newLogs;
};

export const deleteLog = (id: string): PoopLog[] => {
  const logs = getLogs();
  const newLogs = logs.filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
  return newLogs;
};
