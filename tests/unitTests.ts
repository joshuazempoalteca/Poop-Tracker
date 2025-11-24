import { calculateXP, calculateLevel } from '../services/gamificationService';
import { saveLog, deleteLog, getLogs, clearAllAICommentaries } from '../services/storageService';
import { sendFriendRequest, acceptFriendRequest } from '../services/friendsService';
import { registerUser, getCurrentUser, logoutUser } from '../services/authService';
import { BristolType, PoopSize, User } from '../types';

export const runUnitTests = async () => {
    console.group("🧪 DooDoo Log Unit Tests");
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // --- GAMIFICATION TESTS ---
    console.group("Gamification Service");

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

    const level2 = calculateLevel(1001); // Assuming 1000 per level
    assert(level2.level === 2, "1001 XP should be Level 2");

    console.groupEnd();


    // --- STORAGE TESTS ---
    console.group("Storage Service");

    // Setup
    const testId = "test_log_" + Date.now();
    const testLog = {
        id: testId,
        timestamp: Date.now(),
        type: BristolType.Type1,
        notes: "Test",
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

    console.groupEnd();


    // --- FRIENDS TESTS ---
    console.group("Friends Service");

    // Setup: Create 2 temp users
    const userA_Name = "UserA_" + Date.now();
    const userB_Name = "UserB_" + Date.now();

    // We need to register them to put them in the DB
    const userA = registerUser(userA_Name, userA_Name + "@test.com", "pass");
    // Logout to register B
    logoutUser();
    const userB = registerUser(userB_Name, userB_Name + "@test.com", "pass");

    // A sends request to B
    // We need to simulate being User A
    // Note: sendFriendRequest takes (currentUser, targetId)

    try {
        const updatedA = await sendFriendRequest(userA, userB.id);
        assert(updatedA.outgoingRequests?.includes(userB.id) ?? false, "Sender should have target in outgoingRequests");

        // Check B's side (need to fetch fresh B from DB logic, but we can check via authService helper or just trust the return)
        // Ideally we check the DB state.
        // Let's simulate B accepting

        const updatedB_State = await acceptFriendRequest(userB, userA.id);
        assert(updatedB_State.friends?.includes(userA.id) ?? false, "Receiver should have sender in friends list after accept");
        assert(!(updatedB_State.friendRequests?.includes(userA.id) ?? false), "Receiver should NOT have sender in requests list after accept");

    } catch (e) {
        console.error("Friend test failed", e);
        failed++;
    }

    console.groupEnd();

    console.log(`\n📊 Unit Test Summary: ${passed} Passed, ${failed} Failed`);
    console.groupEnd();
};
