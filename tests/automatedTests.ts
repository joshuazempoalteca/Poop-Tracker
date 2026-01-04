
import { registerUser, loginSession, logoutUser } from '../services/authService';
import { searchUsers } from '../services/friendsService';
import { User } from '../types';

/**
 * AUTOMATED TEST SUITE for DooDoo Log
 * Run this by importing it and calling runIntegrationTests() from the browser console or a debug button.
 */

export const runIntegrationTests = async () => {
    console.group("🧪 DooDoo Log Integration Tests");
    
    let testUser: User | null = null;
    const TEST_USERNAME = "AutoTestUser_" + Math.floor(Math.random() * 10000);
    const TEST_EMAIL = `${TEST_USERNAME}@example.com`;

    // TEST 1: Registration
    try {
        console.log(`Test 1: Registering user ${TEST_USERNAME}...`);
        testUser = registerUser(TEST_USERNAME, TEST_EMAIL, "password123");
        if (testUser && testUser.username === TEST_USERNAME) {
            console.log("✅ Registration Passed");
        } else {
            console.error("❌ Registration Failed: User object mismatch");
        }
    } catch (e) {
        console.error("❌ Registration Failed with error:", e);
    }

    // TEST 2: Friend Search (Finding the user we just created)
    try {
        if (testUser) {
            console.log(`Test 2: Searching for newly created user...`);
            // We search for the username we just made
            const results = await searchUsers(TEST_USERNAME);
            const found = results.find(u => u.username === TEST_USERNAME);
            
            if (found) {
                console.log("✅ Friend Search Passed: User found in DB via Friend Service.");
            } else {
                console.error("❌ Friend Search Failed: User not found. (Check friendsService.ts integration with authService)");
                console.log("Results found:", results);
            }
        }
    } catch (e) {
        console.error("❌ Friend Search Error:", e);
    }

    // TEST 3: Login/Logout Persistence Check
    try {
        console.log("Test 3: Checking Storage Persistence...");
        // User was registered, so they should be in localStorage under doodoo_users_db_v1
        const storedDB = localStorage.getItem('doodoo_users_db_v1');
        if (storedDB && storedDB.includes(TEST_USERNAME)) {
             console.log("✅ Data Persistence Passed: User exists in localStorage DB.");
        } else {
             console.error("❌ Data Persistence Failed: User not in localStorage.");
        }
    } catch (e) {
        console.error("❌ Persistence Error:", e);
    }

    console.log("🏁 Tests Completed.");
    console.groupEnd();
};
