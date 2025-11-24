
import { User } from '../types';

const SESSION_KEY = 'doodoo_session_v1';
const USERS_DB_KEY = 'doodoo_users_db_v1';
const REMEMBERED_USERNAME_KEY = 'doodoo_remembered_username';

// --- Masking Helpers ---
const maskEmail = (email: string): string => {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
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
    console.error("Database corruption detected", e);
    return {};
  }
};

const saveUsersDB = (db: Record<string, User>) => {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
};

// Expose DB reader for other services (like FriendsService)
export const getAllUsers = (): User[] => {
  const db = getUsersDB();
  return Object.values(db);
};

export const getUserById = (id: string): User | null => {
  const db = getUsersDB();
  return db[id] || null;
};

// Allow updating any user (for friend requests)
export const updateOtherUser = (user: User): void => {
  const db = getUsersDB();
  if (db[user.id]) {
    db[user.id] = { ...db[user.id], ...user };
    saveUsersDB(db);
  }
};

// --- Auth Methods ---

export const getRememberedUsername = (): string | null => {
  return localStorage.getItem(REMEMBERED_USERNAME_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session) return JSON.parse(session);

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

  const existingId = Object.keys(db).find(key => db[key].username.toLowerCase() === username.toLowerCase());
  if (existingId) {
    throw new Error('Username already taken. Please try another.');
  }

  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    email,
    password,
    phoneNumber,
    isTwoFactorEnabled: !!isTwoFactorEnabled,
    isAiEnabled: false,
    friends: [],
    friendRequests: [],
    outgoingRequests: [],
    xp: 0,
    level: 1
  };

  db[newUser.id] = newUser;
  saveUsersDB(db);

  return newUser;
};

export const verifyCredentials = (username: string, password?: string): User => {
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].username.toLowerCase() === username.toLowerCase());

  if (!userId) {
    throw new Error('User not found.');
  }

  const user = db[userId];

  // Logic: 
  // 1. If user has a password in DB, check it against input.
  // 2. If user has NO password in DB (Legacy account), allow login to let them set one later (or prompt reset).
  if (user.password && user.password !== password) {
    throw new Error('Incorrect password.');
  }

  return user;
};

export const loginSession = (user: User, rememberMe: boolean): void => {
  if (user.isAiEnabled === undefined) user.isAiEnabled = false;

  const userStr = JSON.stringify(user);

  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, userStr);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.setItem(REMEMBERED_USERNAME_KEY, user.username);
  } else {
    sessionStorage.setItem(SESSION_KEY, userStr);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }
};

export const logoutUser = (): void => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
};

export const updateUserProfile = (user: User): void => {
  const db = getUsersDB();
  if (db[user.id]) {
    // Preserve password if the UI object doesn't have it (though it should)
    const existing = db[user.id];
    db[user.id] = { ...existing, ...user };
    saveUsersDB(db);
  }

  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  const localStr = localStorage.getItem(SESSION_KEY);

  if (sessionStr) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (localStr) localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  // Dispatch event to notify App component
  window.dispatchEvent(new CustomEvent('doodoo-user-updated', { detail: user }));
};

// --- Recovery & 2FA Simulations ---

export const recoverUsername = async (email: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());

  if (userId) {
    return `Recovery email sent to ${maskEmail(email)}.`;
  } else {
    // Security: Generic message
    return `If an account exists for ${maskEmail(email)}, we have sent a username reminder.`;
  }
};

export const initiatePasswordReset = async (email: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());

  if (userId) {
    return `Reset code sent to ${maskEmail(email)}.`;
  }
  throw new Error("No account found with that email.");
};

export const confirmPasswordReset = async (email: string, code: string, newPassword: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In real app, verify code here.
  if (code !== '123456') {
    throw new Error("Invalid verification code.");
  }

  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());

  if (userId) {
    db[userId].password = newPassword;
    saveUsersDB(db);
    return "Password updated successfully. Please login.";
  }
  throw new Error("Account lookup failed.");
};


export const sendTwoFactorCode = async (user: User): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if (user.isTwoFactorEnabled && user.phoneNumber) {
    return `Code sent via SMS to ${maskPhone(user.phoneNumber)}`;
  } else {
    return `Login notification sent to ${maskEmail(user.email)}`;
  }
};

export const verifyTwoFactorCode = async (inputCode: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return inputCode.length === 6;
};
