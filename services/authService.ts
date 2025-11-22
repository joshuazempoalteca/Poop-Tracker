import { User } from '../types';

const SESSION_KEY = 'doodoo_session_v1';
const USERS_DB_KEY = 'doodoo_users_db_v1';
const REMEMBERED_USERNAME_KEY = 'doodoo_remembered_username';

// --- Database Helpers ---

const getUsersDB = (): Record<string, User> => {
  try {
    const stored = localStorage.getItem(USERS_DB_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

const saveUsersDB = (db: Record<string, User>) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
};

// --- Auth Methods ---

export const getRememberedUsername = (): string | null => {
  return localStorage.getItem(REMEMBERED_USERNAME_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    // Check Session Storage first (for non-remember-me sessions)
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session);

    // Check Local Storage (for remember-me sessions)
    const local = localStorage.getItem(SESSION_KEY);
    if (local) return JSON.parse(local);

    return null;
  } catch (e) {
    return null;
  }
};

export const registerUser = (username: string, email: string): User => {
  const db = getUsersDB();
  
  // Case-insensitive username check
  const existingId = Object.keys(db).find(key => db[key].username.toLowerCase() === username.toLowerCase());
  if (existingId) {
    throw new Error('Username already taken. Please try another.');
  }

  const newUser: User = { 
    id: crypto.randomUUID(),
    username, 
    email, 
    isAiEnabled: false, // Default to false
    friends: [],
    xp: 0,
    level: 1
  };

  // Save to DB
  db[newUser.id] = newUser;
  saveUsersDB(db);

  return newUser;
};

export const loginUser = (username: string, rememberMe: boolean): User => {
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].username.toLowerCase() === username.toLowerCase());

  if (!userId) {
    throw new Error('User not found. Please check your username or Sign Up.');
  }

  const user = db[userId];
  
  // Initialize defaults if missing from old data
  if (user.isAiEnabled === undefined) user.isAiEnabled = false;

  const userStr = JSON.stringify(user);

  if (rememberMe) {
    // Save to Local, Clear Session
    localStorage.setItem(SESSION_KEY, userStr);
    sessionStorage.removeItem(SESSION_KEY);
    // Save username for next time
    localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
  } else {
    // Save to Session, Clear Local
    sessionStorage.setItem(SESSION_KEY, userStr);
    localStorage.removeItem(SESSION_KEY);
    // Clear remembered username if they opted out this time
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }

  return user;
};

export const logoutUser = (): void => {
  // Clear session from both to ensure clean logout
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  // Note: We do NOT clear REMEMBERED_USERNAME_KEY here so the username persists on the login screen
};

export const updateUserProfile = (user: User): void => {
  // 1. Update the permanent "DB"
  const db = getUsersDB();
  if (db[user.id]) {
    db[user.id] = user;
    saveUsersDB(db);
  }

  // 2. Update the active session (whichever is active)
  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  const localStr = localStorage.getItem(SESSION_KEY);

  // Update whichever storage is currently in use
  if (sessionStr) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  if (localStr) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
};