
import Foundation

enum BristolType: Int, Codable, CaseIterable, Identifiable {
    case type1 = 1
    case type2 = 2
    case type3 = 3
    case type4 = 4
    case type5 = 5
    case type6 = 6
    case type7 = 7
    
    var id: Int { rawValue }
    
    var description: String {
        switch self {
        case .type1: return "Separate hard lumps, like nuts (hard to pass)"
        case .type2: return "Sausage-shaped, but lumpy"
        case .type3: return "Like a sausage but with cracks on its surface"
        case .type4: return "Like a sausage or snake, smooth and soft"
        case .type5: return "Soft blobs with clear cut edges (passed easily)"
        case .type6: return "Fluffy pieces with ragged edges, a mushy stool"
        case .type7: return "Watery, no solid pieces, entirely liquid"
        }
    }
}

enum PoopSize: String, Codable, CaseIterable, Identifiable {
    case small = "SMALL"
    case medium = "MEDIUM"
    case large = "LARGE"
    case massive = "MASSIVE"
    
    var id: String { rawValue }
    
    var displayName: String {
        rawValue.capitalized
    }
}
