
import { calculateXP, calculateLevel } from '../services/gamificationService';
import { saveLog, deleteLog, getLogs, clearAllAICommentaries } from '../services/storageService';
import { sendFriendRequest, acceptFriendRequest } from '../services/friendsService';
import { registerUser, logoutUser } from '../services/authService';
import { BristolType, PoopSize, PoopLog } from '../types';
import { GAME_CONSTANTS } from '../constants';

export const runUnitTests = async () => {
    console.clear();
    console.group("🧪 DooDoo Log Unit Tests");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`%c✅ PASS: ${message}`, 'color: green');
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // --- GAMIFICATION TESTS ---
    console.groupCollapsed("🎮 Gamification Service");

    try {
        // XP Calc
        const xpNormal = calculateXP({ type: BristolType.Type4, size: PoopSize.Medium });
        assert(xpNormal > 0, "XP should be positive for normal log");

        const xpMassive = calculateXP({ type: BristolType.Type4, size: PoopSize.Massive });
        assert(xpMassive > xpNormal, "Massive poop should give more XP than Medium");

        const xpUnhealthy = calculateXP({ type: BristolType.Type7, size: PoopSize.Medium });
        const xpHealthy = calculateXP({ type: BristolType.Type4, size: PoopSize.Medium });
        assert(xpHealthy > xpUnhealthy, "Healthy poop (Type 4) should give more XP than Unhealthy (Type 7)");

        const xpWithBlood = calculateXP({ type: BristolType.Type4, hasBlood: true });
        const xpWithoutBlood = calculateXP({ type: BristolType.Type4, hasBlood: false });
        assert(xpWithBlood < xpWithoutBlood, "Blood should reduce XP (penalty)");

        // Level Calc
        const level1 = calculateLevel(0);
        assert(level1.level === 1, "0 XP should be Level 1");

        // Dynamic check based on constants
        // If XP_PER_LEVEL is 500:
        // Lvl 1: 0-499
        // Lvl 2: 500-999
        const xpForLevel2 = GAME_CONSTANTS.XP_PER_LEVEL + 50; 
        const level2 = calculateLevel(xpForLevel2);
        assert(level2.level === 2, `${xpForLevel2} XP should be Level 2`);
        
    } catch (e) {
        console.error("Gamification Error", e);
        failed++;
    }
    console.groupEnd();


    // --- STORAGE TESTS ---
    console.groupCollapsed("💾 Storage Service");
    const testId = "test_log_" + Date.now();
    try {
        // Setup
        const testLog: PoopLog = {
            id: testId,
            timestamp: Date.now(),
            type: BristolType.Type1,
            notes: "Test Log Unit Test",
            aiCommentary: "AI says hi"
        };

        // Save
        saveLog(testLog);
        const logsAfterSave = getLogs();
        assert(logsAfterSave.some(l => l.id === testId), "saveLog should persist log to storage");

        // Clear AI
        clearAllAICommentaries();
        const logsAfterClear = getLogs();
        const clearedLog = logsAfterClear.find(l => l.id === testId);
        assert(clearedLog !== undefined && clearedLog.aiCommentary === undefined, "clearAllAICommentaries should remove AI text");

        // Delete
        deleteLog(testId);
        const logsAfterDelete = getLogs();
        assert(!logsAfterDelete.some(l => l.id === testId), "deleteLog should remove log from storage");
    } catch (e) {
        console.error("Storage Error", e);
        failed++;
        // Cleanup attempt
        deleteLog(testId);
    }
    console.groupEnd();


    // --- FRIENDS TESTS ---
    console.groupCollapsed("👯 Friends Service");

    try {
        // Setup: Create 2 temp users
        const timestamp = Date.now();
        const userA_Name = `UserA_${timestamp}`;
        const userB_Name = `UserB_${timestamp}`;

        // We need to register them to put them in the DB
        // Note: Logout first to ensure clean slate
        logoutUser();
        const userA = registerUser(userA_Name, `${userA_Name}@test.com`, "pass");
        
        logoutUser();
        const userB = registerUser(userB_Name, `${userB_Name}@test.com`, "pass");

        // A sends request to B
        // Note: sendFriendRequest takes (currentUser, targetId)
        // We simulate User A being logged in by passing userA object
        
        const updatedA = await sendFriendRequest(userA, userB.id);
        assert(updatedA.outgoingRequests?.includes(userB.id) ?? false, "Sender should have target in outgoingRequests");

        // Simulate B accepting
        // We act as User B accepting A
        const updatedB_State = await acceptFriendRequest(userB, userA.id);
        
        assert(updatedB_State.friends?.includes(userA.id) ?? false, "Receiver should have sender in friends list after accept");
        assert(!(updatedB_State.friendRequests?.includes(userA.id) ?? false), "Receiver should NOT have sender in requests list after accept");

    } catch (e) {
        console.error("Friend test failed", e);
        failed++;
    }

    console.groupEnd();

    console.log(`\n📊 Unit Test Summary: %c${passed} Passed%c, %c${failed} Failed`, 'color: green; font-weight: bold', 'color: inherit', 'color: red; font-weight: bold');
    console.groupEnd();
};
