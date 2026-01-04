
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

        const current = getCurrentUser();
        if (current && current.id === user.id) {
            updateUserProfile(user);
        } else {
            window.dispatchEvent(new CustomEvent('doodoo_db_updated'));
        }
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
  if (user.password && user.password !== password) {
    throw new Error('Incorrect password.');
  }

  return user;
};

export const loginSession = (user: User, rememberMe: boolean): void => {
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
    db[user.id] = { ...db[user.id], ...user };
    saveUsersDB(db);
  }

  const sessionStr = sessionStorage.getItem(SESSION_KEY);
  const localStr = localStorage.getItem(SESSION_KEY);

  if (sessionStr) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  if (localStr) localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  window.dispatchEvent(new CustomEvent('doodoo_profile_updated', { detail: user }));
};

// --- Recovery & 2FA Simulations ---

export const recoverUsername = async (email: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const db = getUsersDB();
  const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());
  
  if (userId) {
      const username = db[userId].username;
      // In demo, we notify directly
      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("DooDoo Log Recovery", { body: `Your username is: ${username}` });
      }
      return `Recovery notification sent for ${maskEmail(email)}.`;
  }
  return `If an account exists for ${maskEmail(email)}, we have sent a reminder.`;
};

export const initiatePasswordReset = async (email: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const db = getUsersDB();
    const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());
    
    if (userId) {
        const code = "123456"; // Standard demo code
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification("Password Reset Code", { body: `Your security code is: ${code}` });
        }
        return `Reset code sent to ${maskEmail(email)}.`;
    }
    throw new Error("No account found with that email. Make sure you registered first!");
};

export const confirmPasswordReset = async (email: string, code: string, newPassword: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (code !== '123456') throw new Error("Invalid verification code. (Hint: use 123456)");
    
    const db = getUsersDB();
    const userId = Object.keys(db).find(key => db[key].email.toLowerCase() === email.toLowerCase());
    
    if (userId) {
        db[userId].password = newPassword;
        saveUsersDB(db);
        return "Password updated successfully.";
    }
    throw new Error("Account lookup failed. Please start over.");
};

export const sendTwoFactorCode = async (user: User): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  const code = "123456";
  if ('Notification' in window && Notification.permission === 'granted') {
      new Notification("2FA Code", { body: `Your security code is: ${code}` });
  }
  return user.isTwoFactorEnabled && user.phoneNumber ? `Code sent via SMS to ${maskPhone(user.phoneNumber)}` : `Login notification sent to ${maskEmail(user.email)}`;
};

export const verifyTwoFactorCode = async (inputCode: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return inputCode.length === 6;
};
