
import SwiftUI

struct ContentView: View {
    @EnvironmentObject var viewModel: AppViewModel
    
    // Custom tab selection state
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HistoryListView()
                .tabItem {
                    Label("History", systemImage: "list.bullet")
                }
                .tag(0)

            StatsDashboardView()
                .tabItem {
                    Label("Stats", systemImage: "chart.bar.fill")
                }
                .tag(1)

            HealthTipsView()
                .tabItem {
                    Label("Tips", systemImage: "heart.text.square.fill")
                }
                .tag(2)

            // Friends tab only visible for authenticated users (not guest mode)
            if viewModel.currentUser != nil && !viewModel.isGuest {
                FriendFeedView()
                    .tabItem {
                        Label("Friends", systemImage: "person.2.fill")
                    }
                    .tag(3)
            }

            UserProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
                .tag(4)
        }
        .accentColor(.poopBrown) // Main accent for tabs
        .onAppear {
            let appearance = UITabBarAppearance()
            appearance.backgroundEffect = UIBlurEffect(style: .systemUltraThinMaterial)
            appearance.backgroundColor = UIColor(Color.white.opacity(0.8))
            
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
