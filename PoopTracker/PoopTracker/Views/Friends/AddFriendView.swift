
import SwiftUI

struct AddFriendView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.presentationMode) var presentationMode

    @State private var searchMode = 0 // 0 = username, 1 = ID
    @State private var usernameQuery = ""
    @State private var userIdQuery = ""
    @State private var searchResults: [Profile] = []
    @State private var idSearchResult: Profile?
    @State private var isSearching = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search mode picker
                Picker("Search Mode", selection: $searchMode) {
                    Text("Username").tag(0)
                    Text("Friend Code").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()

                if searchMode == 0 {
                    UsernameSearchView(
                        query: $usernameQuery,
                        results: $searchResults,
                        isSearching: $isSearching,
                        errorMessage: $errorMessage
                    )
                } else {
                    FriendCodeSearchView(
                        query: $userIdQuery,
                        result: $idSearchResult,
                        isSearching: $isSearching,
                        errorMessage: $errorMessage
                    )
                }

                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding()
                }
            }
            .navigationTitle("Add Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Username Search View

struct UsernameSearchView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.presentationMode) var presentationMode

    @Binding var query: String
    @Binding var results: [Profile]
    @Binding var isSearching: Bool
    @Binding var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search username...", text: $query)
                    .textFieldStyle(.plain)
                    .autocapitalization(.none)
                    .disableAutocorrection(true)
                    .onChange(of: query) { _ in
                        Task {
                            await performSearch()
                        }
                    }

                if !query.isEmpty {
                    Button(action: {
                        query = ""
                        results = []
                    }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(uiColor: .secondarySystemGroupedBackground))
            .cornerRadius(10)
            .padding()

            // Results list
            if isSearching {
                ProgressView()
                    .padding()
                Spacer()
            } else if results.isEmpty && !query.isEmpty {
                VStack(spacing: 15) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary)
                    Text("No users found")
                        .foregroundColor(.secondary)
                }
                .padding()
                Spacer()
            } else if results.isEmpty {
                VStack(spacing: 15) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.secondary.opacity(0.5))
                    Text("Search for friends by username")
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                Spacer()
            } else {
                List(results) { profile in
                    UserResultRow(profile: profile)
                }
                .listStyle(.plain)
            }
        }
    }

    private func performSearch() async {
        guard !query.isEmpty else {
            results = []
            return
        }

        isSearching = true
        errorMessage = nil

        do {
            let profiles = try await FriendsService.shared.searchUsersByUsername(query: query)
            // Filter out current user
            results = profiles.filter { $0.id != viewModel.currentUser?.id }
        } catch {
            errorMessage = error.localizedDescription
            results = []
        }

        isSearching = false
    }
}

// MARK: - Friend Code Search View

struct FriendCodeSearchView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.presentationMode) var presentationMode

    @Binding var query: String
    @Binding var result: Profile?
    @Binding var isSearching: Bool
    @Binding var errorMessage: String?

    var body: some View {
        VStack(spacing: 20) {
            // Info text
            Text("Enter your friend's unique code to add them")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
                .padding(.top)

            // ID input field
            VStack(alignment: .leading, spacing: 8) {
                Text("Friend Code")
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack {
                    TextField("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", text: $query)
                        .textFieldStyle(.plain)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                        .font(.system(.body, design: .monospaced))

                    if !query.isEmpty {
                        Button(action: {
                            query = ""
                            result = nil
                        }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color(uiColor: .secondarySystemGroupedBackground))
                .cornerRadius(10)
            }
            .padding(.horizontal)

            // Search button
            Button(action: {
                Task {
                    await findUser()
                }
            }) {
                HStack {
                    if isSearching {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: "magnifyingglass")
                        Text("Find User")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(query.isEmpty ? Color.gray : Color.poopBrown)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(query.isEmpty || isSearching)
            .padding(.horizontal)

            // Result
            if let profile = result {
                VStack(spacing: 15) {
                    Divider()

                    UserResultRow(profile: profile)
                        .padding(.horizontal)
                }
            } else if !isSearching && !query.isEmpty && result == nil && errorMessage == nil {
                Text("User not found")
                    .foregroundColor(.secondary)
                    .padding()
            }

            Spacer()
        }
    }

    private func findUser() async {
        isSearching = true
        errorMessage = nil
        result = nil

        do {
            if let profile = try await FriendsService.shared.findUserById(userId: query) {
                // Don't show current user
                if profile.id != viewModel.currentUser?.id {
                    result = profile
                } else {
                    errorMessage = "That's your own code!"
                }
            } else {
                errorMessage = "User not found"
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isSearching = false
    }
}

// MARK: - User Result Row

struct UserResultRow: View {
    @EnvironmentObject var viewModel: AppViewModel
    @Environment(\.presentationMode) var presentationMode

    let profile: Profile
    @State private var isSending = false
    @State private var requestSent = false

    var body: some View {
        HStack(spacing: 15) {
            // Avatar
            Circle()
                .fill(Color.poopLightBrown.opacity(0.2))
                .frame(width: 50, height: 50)
                .overlay(
                    Text((profile.username ?? "?").prefix(1).uppercased())
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.poopBrown)
                )

            // User info
            VStack(alignment: .leading, spacing: 4) {
                Text(profile.username ?? "Unknown")
                    .font(.headline)
                Text("Level \(profile.level ?? 1)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Send request button
            if requestSent {
                Text("Sent!")
                    .font(.subheadline)
                    .foregroundColor(.green)
            } else if isSending {
                ProgressView()
            } else {
                Button(action: {
                    Task {
                        await sendRequest()
                    }
                }) {
                    Text("Add")
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.poopBrown)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    private func sendRequest() async {
        isSending = true

        await viewModel.sendFriendRequest(toUserId: profile.id)

        isSending = false
        requestSent = true

        // Auto-dismiss after short delay
        try? await Task.sleep(nanoseconds: 1_000_000_000)
        DispatchQueue.main.async {
            presentationMode.wrappedValue.dismiss()
        }
    }
}
