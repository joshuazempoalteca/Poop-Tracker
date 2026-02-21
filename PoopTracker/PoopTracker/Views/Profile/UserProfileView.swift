
import SwiftUI

struct UserProfileView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var showDeleteConfirmation = false
    
    var body: some View {
        NavigationView {
            List {
                Section {
                    if let user = viewModel.currentUser {
                        HStack {
                            Circle()
                                .fill(Color.poopLightBrown.opacity(0.2))
                                .frame(width: 70, height: 70)
                                .overlay(
                                    Text((user.username ?? "User").prefix(1).uppercased())
                                        .font(.title)
                                        .fontWeight(.bold)
                                        .foregroundColor(.poopBrown)
                                )
                            
                            VStack(alignment: .leading) {
                                Text(user.username ?? "User")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                Text("Level \(user.level ?? 1)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.leading, 10)
                        }
                        .padding(.vertical, 10)
                    } else if viewModel.isGuest {
                        VStack(spacing: 15) {
                            Text("Guest Mode")
                                .font(.headline)
                            
                            Text("Your logs are saved locally on this device.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Button("Sign In / Sign Up") {
                                 viewModel.isGuest = false
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(.poopBrown)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                    } else {
                        Text("Loading...")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                }
                
                if viewModel.currentUser != nil { // Only show game stats if logged in
                    Section("User Progress") {
                        HStack {
                            Label("Current Points", systemImage: "star.fill")
                                .foregroundColor(.yellow)
                            Spacer()
                            Text("\(viewModel.currentUser?.xp ?? 0)")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Section("Settings") {
                    Toggle("Notifications", isOn: .constant(true))
                    Link("Privacy Policy", destination: URL(string: "https://picayune-hamburger-9a8.notion.site/300bfc00eab180d39bdeef0438e49b27")!)
                        .foregroundColor(.primary)
                }
                

                
                Section {
                    Button(action: {
                        Task {
                            await viewModel.logout()
                        }
                    }) {
                        Label("Log Out", systemImage: "rectangle.portrait.and.arrow.right")
                            .foregroundColor(.red)
                    }
                    
                    Button(role: .destructive, action: {
                        showDeleteConfirmation = true
                    }) {
                        Label("Delete Account", systemImage: "trash")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Profile")
            .alert("Delete Account", isPresented: $showDeleteConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    Task {
                        await viewModel.deleteAccount()
                    }
                }
            } message: {
                Text("Are you sure you want to delete your account? This action cannot be undone.")
            }
        }
    }
}

