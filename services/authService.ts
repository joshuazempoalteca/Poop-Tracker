import { User } from '../types';

const USER_KEY = 'doodoo_user_v1';

export const getCurrentUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

export const loginUser = (username: string, email: string): User => {
  // In a real app, this would check a DB. 
  // Here we create a new ID if it's a fresh "login" (registration simulation)
  const user: User = { 
    id: crypto.randomUUID(),
    username, 
    email, 
    isAiEnabled: true,
    friends: [], // Initialize empty friend list
    xp: 0,
    level: 1
  };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
};