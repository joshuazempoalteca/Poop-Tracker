
import SwiftUI

struct FriendFeedView: View {
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Image(systemName: "person.2.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(Color.poopBrown.opacity(0.5))
                
                Text("Friends Coming Soon")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text("We are working hard to bring social features to you. Stay tuned!")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .navigationTitle("Friends")
        }
    }
}
