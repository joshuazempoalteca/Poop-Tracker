
import Foundation
import Supabase

class FriendsService {
    static let shared = FriendsService()

    private let client = SupabaseManager.shared.client

    private init() {}

    // MARK: - Friend Requests

    /// Send a friend request to another user
    func sendFriendRequest(toUserId: String) async throws {
        guard let currentUserId = AuthService.shared.session?.user.id.uuidString else {
            throw FriendsError.notAuthenticated
        }

        // Check if friendship already exists
        let existing: [Friendship] = try await client
            .from("friendships")
            .select()
            .or("and(user_id.eq.\(currentUserId),friend_id.eq.\(toUserId)),and(user_id.eq.\(toUserId),friend_id.eq.\(currentUserId))")
            .execute()
            .value

        if !existing.isEmpty {
            throw FriendsError.requestAlreadyExists
        }

        let friendship = Friendship(
            id: UUID().uuidString,
            userId: currentUserId,
            friendId: toUserId,
            status: .pending
        )

        try await client
            .from("friendships")
            .insert(friendship)
            .execute()
    }

    /// Accept an incoming friend request
    func acceptFriendRequest(friendshipId: String) async throws {
        try await client
            .from("friendships")
            .update(["status": FriendshipStatus.accepted.rawValue])
            .eq("id", value: friendshipId)
            .execute()
    }

    /// Decline a friend request (deletes the record)
    func declineFriendRequest(friendshipId: String) async throws {
        try await client
            .from("friendships")
            .delete()
            .eq("id", value: friendshipId)
            .execute()
    }

    /// Block a user (deletes the friend request, same as decline but clearer UX)
    func blockUser(friendshipId: String) async throws {
        try await declineFriendRequest(friendshipId: friendshipId)
    }

    /// Remove an accepted friendship
    func removeFriend(friendshipId: String) async throws {
        try await client
            .from("friendships")
            .delete()
            .eq("id", value: friendshipId)
            .execute()
    }

    // MARK: - Fetching Friendships

    /// Fetch all accepted friends with their profiles
    func fetchFriends() async throws -> [FriendWithProfile] {
        guard let currentUserId = AuthService.shared.session?.user.id.uuidString else {
            throw FriendsError.notAuthenticated
        }

        let friendships: [Friendship] = try await client
            .from("friendships")
            .select()
            .eq("status", value: FriendshipStatus.accepted.rawValue)
            .or("user_id.eq.\(currentUserId),friend_id.eq.\(currentUserId)")
            .execute()
            .value

        return try await fetchProfilesForFriendships(friendships, currentUserId: currentUserId)
    }

    /// Fetch incoming pending friend requests
    func fetchPendingRequests() async throws -> [FriendWithProfile] {
        guard let currentUserId = AuthService.shared.session?.user.id.uuidString else {
            throw FriendsError.notAuthenticated
        }

        let friendships: [Friendship] = try await client
            .from("friendships")
            .select()
            .eq("friend_id", value: currentUserId)
            .eq("status", value: FriendshipStatus.pending.rawValue)
            .execute()
            .value

        return try await fetchProfilesForFriendships(friendships, currentUserId: currentUserId)
    }

    /// Fetch outgoing pending friend requests
    func fetchSentRequests() async throws -> [FriendWithProfile] {
        guard let currentUserId = AuthService.shared.session?.user.id.uuidString else {
            throw FriendsError.notAuthenticated
        }

        let friendships: [Friendship] = try await client
            .from("friendships")
            .select()
            .eq("user_id", value: currentUserId)
            .eq("status", value: FriendshipStatus.pending.rawValue)
            .execute()
            .value

        return try await fetchProfilesForFriendships(friendships, currentUserId: currentUserId)
    }

    // MARK: - User Search

    /// Search for users by username (partial match)
    func searchUsersByUsername(query: String) async throws -> [Profile] {
        guard !query.isEmpty else { return [] }

        let profiles: [Profile] = try await client
            .from("profiles")
            .select()
            .ilike("username", value: "%\(query)%")
            .limit(20)
            .execute()
            .value

        return profiles
    }

    /// Find a specific user by their ID
    func findUserById(userId: String) async throws -> Profile? {
        do {
            let profile: Profile = try await client
                .from("profiles")
                .select()
                .eq("id", value: userId)
                .single()
                .execute()
                .value

            return profile
        } catch {
            return nil
        }
    }

    /// Fetch logs from friends (non-private only)
    func fetchFriendLogs() async throws -> [PoopLog] {
        guard let currentUserId = AuthService.shared.session?.user.id.uuidString else {
            throw FriendsError.notAuthenticated
        }

        // First, get all accepted friendships
        let friendships: [Friendship] = try await client
            .from("friendships")
            .select()
            .eq("status", value: FriendshipStatus.accepted.rawValue)
            .or("user_id.eq.\(currentUserId),friend_id.eq.\(currentUserId)")
            .execute()
            .value

        // Extract friend IDs
        var friendIds: [String] = []
        for friendship in friendships {
            if friendship.userId == currentUserId {
                friendIds.append(friendship.friendId)
            } else {
                friendIds.append(friendship.userId)
            }
        }

        if friendIds.isEmpty {
            return []
        }

        // Fetch non-private logs from friends
        let logs: [PoopLog] = try await client
            .from("poop_logs")
            .select()
            .in("user_id", values: friendIds)
            .eq("is_private", value: false)
            .order("created_at", ascending: false)
            .limit(50)
            .execute()
            .value

        return logs
    }

    // MARK: - Helper Methods

    /// Fetch profiles for a list of friendships
    private func fetchProfilesForFriendships(_ friendships: [Friendship], currentUserId: String) async throws -> [FriendWithProfile] {
        var results: [FriendWithProfile] = []

        for friendship in friendships {
            // Determine which ID is the friend's ID
            let friendId = friendship.userId == currentUserId ? friendship.friendId : friendship.userId

            // Fetch the friend's profile
            if let profile = try await findUserById(userId: friendId) {
                results.append(FriendWithProfile(friendship: friendship, profile: profile))
            }
        }

        return results
    }
}

// MARK: - Errors

enum FriendsError: LocalizedError {
    case notAuthenticated
    case requestAlreadyExists
    case userNotFound

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You must be signed in to use friend features"
        case .requestAlreadyExists:
            return "A friend request already exists with this user"
        case .userNotFound:
            return "User not found"
        }
    }
}
