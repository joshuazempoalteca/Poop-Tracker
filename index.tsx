
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { runIntegrationTests } from './tests/automatedTests';
import { runUnitTests } from './tests/unitTests';
import { getAllUsers } from './services/authService';

// Define the debug tools helper
const listUsers = () => {
    const users = getAllUsers();
    console.group("👥 Registered User Directory");
    if (users.length === 0) {
        console.log("No users registered yet.");
    } else {
        console.table(users.map(u => ({
            id: u.id,
            username: u.username,
            level: u.level,
            friends: u.friends?.length || 0,
            requests: u.friendRequests?.length || 0
        })));
    }
    console.groupEnd();
};

// Robust global exposure
const tools = { listUsers, runUnitTests, runIntegrationTests };
Object.entries(tools).forEach(([name, fn]) => {
    Object.defineProperty(window, name, {
        value: fn,
        configurable: true,
        writable: true
    });
});

console.log("🐛 DooDoo Log Debug Tools Loaded.");
console.log("👉 Run `listUsers()` to see all registered accounts.");
console.log("👉 Run `runUnitTests()` to verify logic.");
console.log("💡 If you get a ReferenceError, try `window.listUsers()` instead.");

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
