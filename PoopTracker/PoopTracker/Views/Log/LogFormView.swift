
import SwiftUI

struct LogFormView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.presentationMode) var presentationMode
    
    @State private var selectedType: BristolType = .type4
    @State private var selectedSize: PoopSize = .medium
    @State private var notes: String = ""
    @State private var hasBlood: Bool = false
    @State private var showSuccess = false
    
    var body: some View {
        NavigationView {
            ZStack {
                Form {
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(BristolType.allCases) { type in
                                BristolTypeCard(type: type, isSelected: selectedType == type)
                                    .onTapGesture {
                                        withAnimation {
                                            selectedType = type
                                        }
                                    }
                            }
                        }
                        .padding(.vertical, 10)
                    }
                    .listRowInsets(EdgeInsets()) // Edge-to-edge scroll
                } header: {
                    Text("Bristol Scale")
                } footer: {
                    Text(selectedType.description)
                    .font(.footnote)
                    .foregroundColor(.secondary)
                }
                
                Section("Details") {
                    Picker("Size", selection: $selectedSize) {
                        ForEach(PoopSize.allCases) { size in
                            Text(size.displayName).tag(size)
                        }
                    }
                    .pickerStyle(.menu)
                    
                    Toggle(isOn: $hasBlood) {
                        HStack {
                            Image(systemName: "drop.fill")
                            .foregroundColor(.red)
                            Text("Blood Present?")
                        }
                    }
                }
                
                Section("Notes") {
                    TextEditor(text: $notes)
                    .frame(height: 100)
                }
                
                Section {
                    Button(action: saveLog) {
                        Text("Save Entry")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .foregroundColor(.white)
                    }
                    .listRowBackground(Color.poopBrown)
                }
            }
            .navigationTitle("New Log")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .foregroundColor(.poopBrown)
                }
            }
            // Success Overlay
            if showSuccess {
                Color.black.opacity(0.4).ignoresSafeArea()
                VStack(spacing: 20) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.green)
                    Text("Log Saved!")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                .padding(40)
                .background(Color(uiColor: .systemBackground))
                .cornerRadius(20)
                .shadow(radius: 10)
                .transition(.scale)
            }
        }
    }
    }
    
    private func saveLog() {
        let newLog = PoopLog(
            type: selectedType,
            notes: notes,
            size: selectedSize,
            hasBlood: hasBlood
        )
        
        Task {
            await viewModel.addLog(newLog)
            
            withAnimation {
                showSuccess = true
            }
            
            // Delay for user to see the success message
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            
            DispatchQueue.main.async {
                presentationMode.wrappedValue.dismiss()
            }
        }
    }
}

struct BristolTypeCard: View {
    let type: BristolType
    let isSelected: Bool
    
    var body: some View {
        VStack {
            Text("\(type.rawValue)")
            .font(.system(size: 24, weight: .bold))
            .foregroundColor(isSelected ? .white : .primary)
            
            Text("Type")
            .font(.caption2)
            .textCase(.uppercase)
            .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
        }
        .frame(width: 70, height: 80)
        .background(isSelected ? Color.poopBrown : Color(uiColor: .secondarySystemBackground))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
            .stroke(isSelected ? Color.poopBrown : Color.clear, lineWidth: 2)
        )
        .shadow(color: isSelected ? .poopBrown.opacity(0.3) : .clear, radius: 4, x: 0, y: 2)
        .scaleEffect(isSelected ? 1.05 : 1.0)
    }
}
