
import Foundation

struct GamificationService {
    static func calculateXP(log: PoopLog) -> Int {
        var xp = 10 // Base XP for logging
        
        // Use computed property 'poopSize' which returns the Enum
        switch log.poopSize {
        case .massive: xp += 20
        case .large: xp += 10
        case .medium: xp += 5
        case .small: xp += 2
        }
        
        // Bonus Features
        if log.hasBlood == true {
            xp += 5
        }
        
        if let weight = log.weight, weight > 0 {
             xp += Int(weight / 10) // 1 XP per 10 grams
        }
        
        return xp
    }
}
