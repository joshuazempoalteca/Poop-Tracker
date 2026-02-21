
import SwiftUI

struct UserProfileView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var showDeleteConfirmation = false
    @State private var showCopiedMessage = false
    
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

                    Section {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Friend Code")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            HStack {
                                Text(viewModel.currentUser?.id ?? "")
                                    .font(.system(.caption, design: .monospaced))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)

                                Spacer()

                                Button(action: {
                                    if let userId = viewModel.currentUser?.id {
                                        UIPasteboard.general.string = userId
                                        showCopiedMessage = true

                                        Task {
                                            try? await Task.sleep(nanoseconds: 2_000_000_000)
                                            showCopiedMessage = false
                                        }
                                    }
                                }) {
                                    HStack(spacing: 4) {
                                        Image(systemName: showCopiedMessage ? "checkmark.circle.fill" : "doc.on.doc")
                                        Text(showCopiedMessage ? "Copied!" : "Copy")
                                    }
                                    .font(.caption)
                                    .foregroundColor(showCopiedMessage ? .green : .poopBrown)
                                }
                                .buttonStyle(.borderless)
                            }
                        }
                        .padding(.vertical, 4)
                    } header: {
                        Text("Share your friend code with others so they can add you")
                            .textCase(.none)
                            .font(.caption)
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

