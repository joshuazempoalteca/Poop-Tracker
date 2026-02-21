
import Foundation

struct Friendship: Identifiable, Codable {
    var id: String
    var userId: String
    var friendId: String
    var status: FriendshipStatus
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case friendId = "friend_id"
        case status
        case createdAt = "created_at"
    }
}

enum FriendshipStatus: String, Codable {
    case pending  // Request sent, awaiting response
    case accepted // Friends
    // Note: declined/blocked requests are deleted, not stored
}

// Helper struct for displaying friends with their profile information
struct FriendWithProfile: Identifiable {
    var id: String { friendship.id }
    var friendship: Friendship
    var profile: Profile

    var isIncoming: Bool {
        // If the current user is the friend_id, this is an incoming request
        // This will be determined in the service layer
        false
    }
}
