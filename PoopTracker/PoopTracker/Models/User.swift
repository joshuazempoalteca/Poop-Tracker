
import Foundation

struct Profile: Identifiable, Codable {
    var id: String // UUID
    var username: String?
    var avatarUrl: String?
    var level: Int?
    var xp: Int?
    var prestige: Int?
    var isAiEnabled: Bool?
    var updatedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case username
        case avatarUrl = "avatar_url"
        case level
        case xp
        case prestige
        case isAiEnabled = "is_ai_enabled"
        case updatedAt = "updated_at"
    }
}

// Keeping User struct for Auth session, but adding Profile for DB
struct User: Identifiable, Codable {
    var id: String
    var email: String?
}
