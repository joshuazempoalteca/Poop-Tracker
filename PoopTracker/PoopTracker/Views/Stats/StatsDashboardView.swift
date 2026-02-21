
import SwiftUI
import Charts

struct StatsDashboardView: View {
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    
                    // Summary Card
                    HStack {
                        StatsCard(title: "Total Logs", value: "\(viewModel.logs.count)", icon: "list.clipboard.fill", color: .poopBrown)
                         // Replaced XP with something more medical/useful or just removed
                        StatsCard(title: "Avg Duration", value: "\(calculateAvgDuration())m", icon: "clock.fill", color: .blue)
                    }
                    .padding(.horizontal)
                    
                    // Chart
                    chartSection
                    
                }
                .padding(.top)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Stats")
        }
    }
    
    // Breaking out the chart view helps the compiler
    private var chartSection: some View {
        VStack(alignment: .leading) {
            Text("Bristol Distribution")
                .font(.headline)
                .padding(.bottom, 10)
            
            Chart {
                ForEach(BristolType.allCases) { type in
                    BarMark(
                        x: .value("Type", "T\(type.rawValue)"),
                        y: .value("Count", getCount(for: type))
                    )
                    .foregroundStyle(Color.poopBrown.gradient)
                    .cornerRadius(4)
                }
            }
            .frame(height: 220)
        }
        .padding()
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
    
    // Helper function also helps compiler
    private func getCount(for type: BristolType) -> Int {
        // Also note: logic needs to check rawValue equality due to how data might be stored
        return viewModel.logs.filter { $0.type == type.rawValue }.count
    }
    
    private func calculateAvgDuration() -> Int {
        let durations = viewModel.logs.compactMap { $0.durationMinutes }
        guard !durations.isEmpty else { return 0 }
        return durations.reduce(0, +) / durations.count
    }
}

struct StatsCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }
            
            Text(value)
                .font(.system(size: 28, weight: .bold))
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}
