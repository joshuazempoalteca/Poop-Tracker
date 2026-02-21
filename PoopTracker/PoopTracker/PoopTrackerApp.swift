
import SwiftUI

@main
struct PoopTrackerApp: App {
    @StateObject private var viewModel = AppViewModel()
    
    // Global appearance cleanups
    init() {
        print("🚀 PoopTracker starting up...")
        // Enforce dark mode specific tweaks if needed, 
        // but SwiftUI adapts well automatically.
    }
    
    var body: some Scene {
        WindowGroup {
            Group {
                if viewModel.currentUser != nil || viewModel.isGuest {
                    ContentView()
                } else {
                    AuthView()
                }
            }
            .environmentObject(viewModel)
            .preferredColorScheme(.light) // Or make dynamic, sticking to light for cleanliness for now or respect system
        }
    }
}
