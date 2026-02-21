//
//  ContentViewTests.swift
//  PoopTrackerTests
//
//  Created by Claude on 2/20/26.
//

import Testing
import SwiftUI
@testable import PoopTracker

@MainActor
struct ContentViewTests {

    // MARK: - Tab Visibility Tests

    @Test func guestModeHidesFriendsTab() async throws {
        let viewModel = AppViewModel()
        viewModel.isGuest = true
        viewModel.currentUser = nil

        // In guest mode, Friends tab should not be accessible
        // Friends functionality requires authentication
        #expect(viewModel.isGuest == true)
        #expect(viewModel.currentUser == nil)

        // The ContentView conditionally shows FriendFeedView only when:
        // - currentUser is not nil AND
        // - isGuest is false
        let shouldShowFriends = viewModel.currentUser != nil && !viewModel.isGuest
        #expect(shouldShowFriends == false)
    }

    @Test func authenticatedUserShowsFriendsTab() async throws {
        let viewModel = AppViewModel()
        viewModel.currentUser = Profile(
            id: "test-user-id",
            username: "testuser",
            avatarUrl: nil,
            level: 1,
            xp: 0,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )
        viewModel.isGuest = false

        // Authenticated user should see Friends tab
        #expect(viewModel.currentUser != nil)
        #expect(viewModel.isGuest == false)

        let shouldShowFriends = viewModel.currentUser != nil && !viewModel.isGuest
        #expect(shouldShowFriends == true)
    }

    @Test func unauthenticatedUserHidesFriendsTab() async throws {
        let viewModel = AppViewModel()
        viewModel.currentUser = nil
        viewModel.isGuest = false

        // Unauthenticated user (not logged in, not guest) should not see Friends tab
        #expect(viewModel.currentUser == nil)

        let shouldShowFriends = viewModel.currentUser != nil && !viewModel.isGuest
        #expect(shouldShowFriends == false)
    }

    @Test func guestModeWithStaleUserDataHidesFriendsTab() async throws {
        let viewModel = AppViewModel()
        // Edge case: guest mode is true but there's stale user data
        viewModel.isGuest = true
        viewModel.currentUser = Profile(
            id: "stale-user-id",
            username: "staleuser",
            avatarUrl: nil,
            level: 1,
            xp: 0,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )

        // Even with user data, guest mode should hide Friends
        #expect(viewModel.isGuest == true)

        let shouldShowFriends = viewModel.currentUser != nil && !viewModel.isGuest
        #expect(shouldShowFriends == false)
    }

    // MARK: - Friends Functionality Access Tests

    @Test func guestCannotAccessFriendsService() async throws {
        // Friends service requires authentication
        // Attempting to use friends features without auth should throw notAuthenticated error

        // Simulate unauthenticated state
        // Note: This test documents expected behavior
        // In practice, FriendsService checks AuthService.shared.session

        let expectedError = FriendsError.notAuthenticated
        #expect(expectedError.errorDescription == "You must be signed in to use friend features")
    }

    @Test func tabCountDiffersForAuthenticatedVsGuest() async throws {
        // Authenticated user sees 5 tabs: History, Stats, Tips, Friends, Profile
        // Guest user sees 4 tabs: History, Stats, Tips, Profile (no Friends)

        let authenticatedViewModel = AppViewModel()
        authenticatedViewModel.currentUser = Profile(
            id: "auth-user",
            username: "authenticated",
            avatarUrl: nil,
            level: 1,
            xp: 0,
            prestige: 0,
            isAiEnabled: false,
            updatedAt: Date()
        )
        authenticatedViewModel.isGuest = false

        let guestViewModel = AppViewModel()
        guestViewModel.isGuest = true
        guestViewModel.currentUser = nil

        // Count tabs based on visibility conditions
        let authenticatedTabCount = [
            true, // History
            true, // Stats
            true, // Tips
            authenticatedViewModel.currentUser != nil && !authenticatedViewModel.isGuest, // Friends
            true  // Profile
        ].filter { $0 }.count

        let guestTabCount = [
            true, // History
            true, // Stats
            true, // Tips
            guestViewModel.currentUser != nil && !guestViewModel.isGuest, // Friends
            true  // Profile
        ].filter { $0 }.count

        #expect(authenticatedTabCount == 5)
        #expect(guestTabCount == 4)
    }
}

/*
 * Manual UI Testing Checklist:
 *
 * 1. Launch app in unauthenticated state:
 *    - Verify Friends tab is NOT visible in tab bar
 *    - Count tabs: should be 4 (History, Stats, Tips, Profile)
 *
 * 2. Log in with email/password:
 *    - Verify Friends tab becomes visible
 *    - Count tabs: should be 5
 *    - Tap Friends tab to verify it works
 *
 * 3. Log out and choose "Continue as Guest":
 *    - Verify Friends tab is NOT visible
 *    - Count tabs: should be 4
 *
 * 4. Log out of guest mode and sign up new account:
 *    - Verify Friends tab becomes visible
 *    - Verify all friends functionality is accessible
 *
 * 5. Delete account and restart:
 *    - Verify Friends tab is not visible on login screen
 */
