import SwiftUI

struct HealthTipsView: View {
    let tips = [
        HealthTip(title: "Stay Hydrated", description: "Drinking water helps soften stool and prevents constipation.", icon: "drop.fill", color: .blue),
        HealthTip(title: "Eat Fiber", description: "Fiber adds bulk to stool. Eat fruits, vegetables, and whole grains.", icon: "leaf.fill", color: .green),
        HealthTip(title: "Regular Exercise", description: "Movement helps digestion. Try walking or jogging.", icon: "figure.walk", color: .orange),
        HealthTip(title: "Don't Delay", description: "Go when you feel the urge. Holding it in can cause constipation.", icon: "exclamationmark.triangle.fill", color: .red)
    ]
    
    var body: some View {
        NavigationView {
            List(tips) { tip in
                HStack(alignment: .top, spacing: 15) {
                    Image(systemName: tip.icon)
                        .font(.title)
                        .foregroundColor(tip.color)
                        .frame(width: 40)
                    
                    VStack(alignment: .leading, spacing: 5) {
                        Text(tip.title)
                            .font(.headline)
                        Text(tip.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 8)
            }
            .navigationTitle("Health Tips")
        }
    }
}

struct HealthTip: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let icon: String
    let color: Color
}
