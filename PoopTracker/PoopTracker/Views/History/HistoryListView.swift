
import SwiftUI

struct HistoryListView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var showingLogForm = false
    @State private var logToEdit: PoopLog?
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color(uiColor: .systemGroupedBackground)
                    .ignoresSafeArea()
                
                if viewModel.logs.isEmpty {
                    VStack(spacing: 15) {
                        Image(systemName: "list.clipboard")
                            .font(.system(size: 50))
                            .foregroundColor(.gray)
                        Text("No logs yet.")
                            .font(.headline)
                            .foregroundColor(.gray)
                        Text("Tap + to add your first entry!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .opacity(0.7)
                } else {
                    List {
                        ForEach(viewModel.logs) { log in
                            HistoryRow(log: log)
                                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                                .listRowBackground(Color.clear)
                                .listRowSeparator(.hidden)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    logToEdit = log
                                }
                        }
                        .onDelete { indexSet in
                            performDelete(at: indexSet)
                        }
                    }
                    .listStyle(.plain)
                }
                
                // Floating Action Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            showingLogForm = true
                        }) {
                            Image(systemName: "plus")
                                .font(.system(size: 24, weight: .bold))
                                .foregroundColor(.white)
                                .frame(width: 60, height: 60)
                                .background(Color.poopBrown)
                                .clipShape(Circle())
                                .shadow(color: .poopBrown.opacity(0.4), radius: 8, x: 0, y: 4)
                        }
                        .padding(.trailing, 20)
                        .padding(.bottom, 20)
                    }
                }
            }
            .navigationTitle("History")
            .sheet(isPresented: $showingLogForm) {
                LogFormView()
            }
            .sheet(item: $logToEdit) { log in
                LogFormView(existingLog: log)
            }
        }
    }
    
    private func performDelete(at offsets: IndexSet) {
        Task {
            for index in offsets {
                if let id = viewModel.logs[index].id {
                    await viewModel.deleteLog(id: id)
                }
            }
        }
    }
}

struct HistoryRow: View {
    let log: PoopLog
    
    var body: some View {
        HStack {
            // Type Indicator
            ZStack {
                Circle()
                    .fill(Color.poopLightBrown.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                // Safe unwrap of rawValue Int
                Text("\(log.type)")
                    .font(.system(size: 24, weight: .bold, design: .rounded))
                    .foregroundColor(.poopBrown)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                // Safe unwrap of Date
                Text(log.timestamp ?? Date(), style: .date)
                    .font(.headline)
                    .foregroundColor(.primary)
                Text(log.timestamp ?? Date(), style: .time)
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if let notes = log.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            if let xp = log.xpGained {
                VStack(alignment: .trailing) {
                    Text("+\(xp) XP")
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.1))
                        .foregroundColor(.green)
                        .cornerRadius(8)
                }
            }
        }
        .padding()
        .background(Color.cardBackground)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}
