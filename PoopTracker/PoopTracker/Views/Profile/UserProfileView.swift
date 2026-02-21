
import SwiftUI

struct UserProfileView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var showDeleteAccountConfirmation = false
    @State private var showDeleteDataConfirmation = false
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
                

                
                // Different options for authenticated vs guest users
                if viewModel.isGuest {
                    // Guest mode: Only show Delete Data
                    Section {
                        Button(role: .destructive, action: {
                            showDeleteDataConfirmation = true
                        }) {
                            Label("Delete Data", systemImage: "trash")
                                .foregroundColor(.red)
                        }
                    } footer: {
                        Text("This will delete all locally stored logs on this device")
                            .font(.caption)
                    }
                } else if viewModel.currentUser != nil {
                    // Authenticated user: Show both Delete Data and Delete Account
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
                            showDeleteDataConfirmation = true
                        }) {
                            Label("Delete Data", systemImage: "doc.on.doc.fill")
                                .foregroundColor(.orange)
                        }

                        Button(role: .destructive, action: {
                            showDeleteAccountConfirmation = true
                        }) {
                            Label("Delete Account", systemImage: "trash")
                                .foregroundColor(.red)
                        }
                    } footer: {
                        Text("Delete Data removes your logs but keeps your account. Delete Account removes everything permanently.")
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Profile")
            .alert("Delete Account", isPresented: $showDeleteAccountConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete Account", role: .destructive) {
                    Task {
                        await viewModel.deleteAccount()
                    }
                }
            } message: {
                Text("Are you sure you want to delete your account? This will permanently delete your account, all logs, and friend connections. This action cannot be undone.")
            }
            .alert("Delete Data", isPresented: $showDeleteDataConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    Task {
                        await viewModel.deleteData()
                    }
                }
            } message: {
                if viewModel.isGuest {
                    Text("Are you sure you want to delete all your locally stored logs? This action cannot be undone.")
                } else {
                    Text("Are you sure you want to delete all your logs? Your account and friends will remain intact, but all log data will be permanently deleted.")
                }
            }
        }
    }
}

