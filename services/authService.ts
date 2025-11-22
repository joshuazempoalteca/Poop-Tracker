
import { User } from '../types';

const SESSION_KEY = 'doodoo_session_v1';
const USERS_DB_KEY = 'doodoo_users_db_v1';
const REMEMBERED_USERNAME_KEY = 'doodoo_remembered_username';

// --- Masking Helpers ---
const maskEmail = (email: string): string => {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  // Show first 2 chars if long enough, else 1
  const visibleLen = name.length > 2 ? 2 : 1;
  return `${name.substring(0, visibleLen)}****@${domain}`;
};

const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  const last4 = phone.slice(-4);
  return `(***) ***-${last4}`;
};

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

export const registerUser = (
  username: string, 
  email: string, 
  password?: string,
  phoneNumber?: string,
  isTwoFactorEnabled?: boolean
): User => {
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
    password, // In a real app, this MUST be hashed. Storing plain for simulation only.
    phoneNumber,
    isTwoFactorEnabled: !!isTwoFactorEnabled,
    isAiEnabled: false, 
    friends: [],
    xp: 0,
    level: 1
  };

  // Save to DB
  db[newUser.id] = newUser;
  saveUsersDB(db);

  return newUser;
};

/**
 * Checks credentials. Returns the user object if valid, throws error if not.
 * Does NOT set the session.
 */
export const verifyCredentials = (username: string, password?: string): User => {
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].username.toLowerCase() === username.toLowerCase());

  if (!userId) {
    throw new Error('User not found.');
  }

  const user = db[userId];

  // In simulation, if user has no password (old account), allow login or force update. 
  // Here we allow it if the account has no password set, otherwise check it.
  if (user.password && user.password !== password) {
    throw new Error('Incorrect password.');
  }

  return user;
};

/**
 * Finalizes the login by setting session storage
 */
export const loginSession = (user: User, rememberMe: boolean): void => {
  // Initialize defaults if missing from old data
  if (user.isAiEnabled === undefined) user.isAiEnabled = false;

  const userStr = JSON.stringify(user);

  if (rememberMe) {
    // Save to Local, Clear Session
    localStorage.setItem(SESSION_KEY, userStr);
    sessionStorage.removeItem(SESSION_KEY);
    // Save username for next time
    localStorage.setItem(REMEMBERED_USERNAME_KEY, user.username);
  } else {
    // Save to Session, Clear Local
    sessionStorage.setItem(SESSION_KEY, userStr);
    localStorage.removeItem(SESSION_KEY);
    // Clear remembered username if they opted out this time
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }
};

// Backwards compatibility wrapper (if used elsewhere without password)
export const loginUser = (username: string, rememberMe: boolean): User => {
  const user = verifyCredentials(username); // Works for legacy accounts with no password
  loginSession(user, rememberMe);
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

// --- Recovery & 2FA Simulations ---

export const recoverUsername = async (email: string): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());
  
  if (userId) {
    // In a real app, we would send an email here.
    // For security, we do not display the username in the UI message anymore.
    return `Recovery email sent to ${maskEmail(email)}. Please check your inbox.`;
  } else {
    // Security: Don't reveal if email exists or not usually, but for this mock:
    throw new Error('No account found with that email address.');
  }
};

export const sendTwoFactorCode = async (user: User): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  if (user.isTwoFactorEnabled && user.phoneNumber) {
    console.log(`[SMS SIMULATION] Sending code ${code} to ${user.phoneNumber}`);
    return `Code sent via SMS to ${maskPhone(user.phoneNumber)}`;
  } else {
    // This is the fallback email notification or code
    console.log(`[EMAIL SIMULATION] Sending login alert/code ${code} to ${user.email}`);
    return `Login notification sent to ${maskEmail(user.email)}`;
  }
};

export const verifyTwoFactorCode = async (inputCode: string): Promise<boolean> => {
    // Mock verification - in a real app this checks against Redis/DB
    // For this mock, we just accept any 6 digit code for simplicity, 
    // or we could store the generated code in a temp var, but stateless is easier for mock.
    await new Promise(resolve => setTimeout(resolve, 800));
    return inputCode.length === 6;
};
