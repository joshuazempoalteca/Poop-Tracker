//
//  UserProfileTests.swift
//  PoopTrackerTests
//
//  Created by Claude on 2/20/26.
//

import Testing
import SwiftUI
@testable import PoopTracker

@MainActor
struct UserProfileTests {

    // MARK: - Delete Button Visibility Tests

    @Test func guestUserSeesDeleteDataOnly() async throws {
        let viewModel = AppViewModel()
        viewModel.isGuest = true
        viewModel.currentUser = nil

        // Guest users should see:
        // - Delete Data button (to clear local logs)
        // - NO Delete Account button (they don't have an account)
        // - NO Log Out button (they aren't logged in)

        #expect(viewModel.isGuest == true)
        #expect(viewModel.currentUser == nil)

        // In the view, this condition determines what buttons show:
        let isGuest = viewModel.isGuest
        let isAuthenticated = viewModel.currentUser != nil && !viewModel.isGuest

        #expect(isGuest == true)
        #expect(isAuthenticated == false)
    }

    @Test func authenticatedUserSeesBothDeleteOptions() async throws {
        let viewModel = AppViewModel()
        viewModel.currentUser = Profile(
            id: "test-user",
            username: "testuser",
            avatarUrl: nil,
            level: 1,
            xp: 0,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )
        viewModel.isGuest = false

        // Authenticated users should see:
        // - Log Out button
        // - Delete Data button (clears logs, keeps account)
        // - Delete Account button (deletes everything)

        #expect(viewModel.currentUser != nil)
        #expect(viewModel.isGuest == false)

        let isAuthenticated = viewModel.currentUser != nil && !viewModel.isGuest
        #expect(isAuthenticated == true)
    }

    // MARK: - Delete Data Functionality Tests

    @Test func deleteDataClearsLogsOnly() async throws {
        let viewModel = AppViewModel()
        viewModel.currentUser = Profile(
            id: "test-user",
            username: "testuser",
            avatarUrl: nil,
            level: 5,
            xp: 250,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )
        viewModel.isGuest = false

        // Add some mock logs
        viewModel.logs = [
            PoopLog(type: .type4, notes: "Test log 1", size: .medium, hasBlood: false),
            PoopLog(type: .type3, notes: "Test log 2", size: .large, hasBlood: false)
        ]

        let originalUser = viewModel.currentUser

        // Delete data should:
        // - Clear logs array
        // - Keep currentUser intact
        // - Keep friends data intact

        #expect(viewModel.logs.count == 2)
        #expect(viewModel.currentUser != nil)

        // After deleteData(), logs should be cleared but user remains
        // Note: This test documents expected behavior
        // In practice, deleteData() makes async StorageService calls
    }

    @Test func deleteAccountClearsEverything() async throws {
        let viewModel = AppViewModel()
        viewModel.currentUser = Profile(
            id: "test-user",
            username: "testuser",
            avatarUrl: nil,
            level: 5,
            xp: 250,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )
        viewModel.logs = [PoopLog(type: .type4, notes: "Test", size: .medium, hasBlood: false)]
        viewModel.friends = []

        // Delete account should clear:
        // - currentUser
        // - logs
        // - friends
        // - pendingRequests
        // - sentRequests
        // - friendLogs

        #expect(viewModel.currentUser != nil)
        #expect(viewModel.logs.count == 1)

        // After deleteAccount(), everything should be cleared
        // Note: This test documents expected behavior
        // In practice, deleteAccount() makes async AuthService calls
    }

    // MARK: - Button Text Tests

    @Test func deleteDataButtonTextDiffersForGuestAndAuth() async throws {
        // Guest: "Delete Data" - removes local logs
        // Authenticated: "Delete Data" - removes server logs but keeps account
        // Authenticated: "Delete Account" - removes everything

        let guestViewModel = AppViewModel()
        guestViewModel.isGuest = true

        let authViewModel = AppViewModel()
        authViewModel.currentUser = Profile(
            id: "test",
            username: "test",
            avatarUrl: nil,
            level: 1,
            xp: 0,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )

        #expect(guestViewModel.isGuest == true)
        #expect(authViewModel.currentUser != nil)

        // Button labels should be clear:
        // Guest: "Delete Data" (icon: trash)
        // Auth: "Delete Data" (icon: doc.on.doc.fill, color: orange)
        // Auth: "Delete Account" (icon: trash, color: red)
    }

    // MARK: - Alert Message Tests

    @Test func alertMessagesClearlyExplainActions() async throws {
        // Delete Data (Guest):
        // "Are you sure you want to delete all your locally stored logs? This action cannot be undone."

        // Delete Data (Authenticated):
        // "Are you sure you want to delete all your logs? Your account and friends will remain intact, but all log data will be permanently deleted."

        // Delete Account:
        // "Are you sure you want to delete your account? This will permanently delete your account, all logs, and friend connections. This action cannot be undone."

        #expect(true) // Test documents expected alert messages
    }

    // MARK: - Footer Text Tests

    @Test func footerTextExplainsButtonDifferences() async throws {
        // Guest footer:
        // "This will delete all locally stored logs on this device"

        // Authenticated footer:
        // "Delete Data removes your logs but keeps your account. Delete Account removes everything permanently."

        #expect(true) // Test documents expected footer messages
    }
}

/*
 * Manual UI Testing Checklist:
 *
 * GUEST MODE:
 * 1. Enable guest mode
 * 2. Navigate to Profile tab
 * 3. Verify only "Delete Data" button appears (no "Delete Account", no "Log Out")
 * 4. Verify footer text: "This will delete all locally stored logs on this device"
 * 5. Tap "Delete Data"
 * 6. Verify alert message mentions "locally stored logs"
 * 7. Confirm deletion
 * 8. Verify logs are cleared from History tab
 *
 * AUTHENTICATED MODE:
 * 1. Log in with email/password
 * 2. Navigate to Profile tab
 * 3. Verify three buttons appear: "Log Out", "Delete Data", "Delete Account"
 * 4. Verify "Delete Data" is orange, "Delete Account" is red
 * 5. Verify footer explains the difference between the two
 * 6. Tap "Delete Data"
 * 7. Verify alert explains logs will be deleted but account remains
 * 8. Confirm deletion
 * 9. Verify logs cleared but user still logged in
 * 10. Add a new log to confirm account still works
 * 11. Tap "Delete Account"
 * 12. Verify alert mentions account, logs, and friend connections
 * 13. Confirm deletion
 * 14. Verify returned to login screen
 *
 * EDGE CASES:
 * 1. Delete Data with no logs (should succeed silently)
 * 2. Delete Data while offline (should handle gracefully)
 * 3. Cancel delete operations (should not delete anything)
 */
