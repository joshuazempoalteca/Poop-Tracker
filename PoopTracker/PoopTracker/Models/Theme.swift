
import SwiftUI

extension Color {
    static let poopBrown = Color(red: 0.4, green: 0.2, blue: 0.1)
    static let poopLightBrown = Color(red: 0.6, green: 0.4, blue: 0.25)
    static let cream = Color(red: 0.98, green: 0.96, blue: 0.94)
    static let cardBackground = Color("CardBackground") // Assumes Asset, fallback to system
}

struct AppTheme {
    static let gradient = LinearGradient(
        colors: [.poopBrown, .poopLightBrown],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    
    static let surface = Material.ultraThin
}
