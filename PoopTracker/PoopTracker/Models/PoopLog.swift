
import Foundation

struct PoopLog: Identifiable, Codable {
    var id: String? // Optional because Supabase generates it
    var userId: String? // Foreign Key
    var timestamp: Date? // created_at
    var type: Int // BristolType saved as Int
    var notes: String?
    var durationMinutes: Int?
    var aiCommentary: String?
    var painLevel: Int?
    var wipes: Int?
    var isClog: Bool?
    var size: String? // Saved as String
    var hasBlood: Bool?
    var xpGained: Int?
    var weight: Double?
    var isPrivate: Bool?
    
    // Computed helper for Enum mapping
    var bristolType: BristolType {
        get { BristolType(rawValue: type) ?? .type4 }
        set { type = newValue.rawValue }
    }
    
    var poopSize: PoopSize {
        get { PoopSize(rawValue: size ?? "MEDIUM") ?? .medium }
        set { size = newValue.rawValue }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case timestamp = "created_at"
        case type
        case notes
        case durationMinutes = "duration_minutes"
        case aiCommentary = "ai_commentary"
        case painLevel = "pain_level"
        case wipes
        case isClog = "is_clog"
        case size
        case hasBlood = "has_blood"
        case xpGained = "xp_gained"
        case weight // Not in SQL schema shown, but useful to keep if we add it
        case isPrivate = "is_private"
    }
    
    init(
        type: BristolType = .type4,
        notes: String = "",
        size: PoopSize = .medium,
        hasBlood: Bool = false
    ) {
        self.type = type.rawValue
        self.notes = notes
        self.size = size.rawValue
        self.hasBlood = hasBlood
        self.timestamp = Date()
    }
}
