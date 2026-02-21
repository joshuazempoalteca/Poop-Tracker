
import SwiftUI

struct FriendFeedView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var selectedTab = 0
    @State private var showingAddFriend = false

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Segmented Control
                Picker("View", selection: $selectedTab) {
                    Text("Feed").tag(0)
                    Text("Friends").tag(1)
                    Text("Requests").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                // Content based on selected tab
                Group {
                    if selectedTab == 0 {
                        FeedTabView()
                    } else if selectedTab == 1 {
                        FriendsTabView()
                    } else {
                        RequestsTabView()
                    }
                }
            }
            .navigationTitle("Friends")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingAddFriend = true
                    }) {
                        Image(systemName: "person.badge.plus")
                            .foregroundColor(.poopBrown)
                    }
                }
            }
            .sheet(isPresented: $showingAddFriend) {
                AddFriendView()
            }
            .task {
                await loadData()
            }
            .refreshable {
                await loadData()
            }
        }
    }

    private func loadData() async {
        async let friends: () = viewModel.fetchFriends()
        async let requests: () = viewModel.fetchPendingRequests()
        async let sent: () = viewModel.fetchSentRequests()
        async let logs: () = viewModel.fetchFriendLogs()

        _ = await (friends, requests, sent, logs)
    }
}

// MARK: - Feed Tab

struct FeedTabView: View {
    @EnvironmentObject var viewModel: AppViewModel

    var body: some View {
        if viewModel.friendLogs.isEmpty {
            VStack(spacing: 20) {
                Image(systemName: "newspaper")
                    .font(.system(size: 80))
                    .foregroundStyle(Color.poopBrown.opacity(0.5))

                Text("No Activity Yet")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Add friends to see their logs here")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            List(viewModel.friendLogs) { log in
                FriendLogRow(log: log)
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
            .listStyle(.plain)
        }
    }
}

// MARK: - Friends Tab

struct FriendsTabView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var friendToRemove: FriendWithProfile?

    var body: some View {
        if viewModel.friends.isEmpty {
            VStack(spacing: 20) {
                Image(systemName: "person.2.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(Color.poopBrown.opacity(0.5))

                Text("No Friends Yet")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Tap + to add friends")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            List(viewModel.friends) { friend in
                HStack(spacing: 15) {
                    // Avatar
                    Circle()
                        .fill(Color.poopLightBrown.opacity(0.2))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text((friend.profile.username ?? "?").prefix(1).uppercased())
                                .font(.title3)
                                .fontWeight(.bold)
                                .foregroundColor(.poopBrown)
                        )

                    // Username
                    VStack(alignment: .leading, spacing: 4) {
                        Text(friend.profile.username ?? "Unknown")
                            .font(.headline)
                        Text("Level \(friend.profile.level ?? 1)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    // Remove button
                    Button(action: {
                        friendToRemove = friend
                    }) {
                        Image(systemName: "person.fill.xmark")
                            .foregroundColor(.red)
                    }
                    .buttonStyle(.borderless)
                }
                .padding(.vertical, 8)
            }
            .listStyle(.plain)
            .alert("Remove Friend", isPresented: .constant(friendToRemove != nil), presenting: friendToRemove) { friend in
                Button("Cancel", role: .cancel) {
                    friendToRemove = nil
                }
                Button("Remove", role: .destructive) {
                    Task {
                        await viewModel.removeFriend(friendshipId: friend.friendship.id)
                        friendToRemove = nil
                    }
                }
            } message: { friend in
                Text("Are you sure you want to remove \(friend.profile.username ?? "this friend")?")
            }
        }
    }
}

// MARK: - Requests Tab

struct RequestsTabView: View {
    @EnvironmentObject var viewModel: AppViewModel

    var body: some View {
        List {
            // Incoming Requests Section
            if !viewModel.pendingRequests.isEmpty {
                Section("Incoming Requests") {
                    ForEach(viewModel.pendingRequests) { request in
                        IncomingRequestRow(request: request)
                    }
                }
            }

            // Sent Requests Section
            if !viewModel.sentRequests.isEmpty {
                Section("Sent Requests") {
                    ForEach(viewModel.sentRequests) { request in
                        SentRequestRow(request: request)
                    }
                }
            }

            // Empty state
            if viewModel.pendingRequests.isEmpty && viewModel.sentRequests.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "tray")
                        .font(.system(size: 60))
                        .foregroundStyle(Color.secondary.opacity(0.5))

                    Text("No Requests")
                        .font(.headline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .listRowBackground(Color.clear)
            }
        }
        .listStyle(.insetGrouped)
    }
}

// MARK: - Row Components

struct FriendLogRow: View {
    let log: PoopLog
    @State private var username: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // User info
            HStack {
                Circle()
                    .fill(Color.poopLightBrown.opacity(0.2))
                    .frame(width: 35, height: 35)
                    .overlay(
                        Text((username ?? "?").prefix(1).uppercased())
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.poopBrown)
                    )

                Text(username ?? "Loading...")
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Spacer()

                if let timestamp = log.timestamp {
                    Text(timestamp, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Log details
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.poopLightBrown.opacity(0.2))
                        .frame(width: 50, height: 50)
                    Text("\(log.type)")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.poopBrown)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Type \(log.type) • \(log.poopSize.displayName)")
                        .font(.subheadline)

                    if let notes = log.notes, !notes.isEmpty {
                        Text(notes)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(2)
                    }
                }

                Spacer()

                if let xp = log.xpGained {
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
        .background(Color(uiColor: .secondarySystemGroupedBackground))
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
        .task {
            await fetchUsername()
        }
    }

    private func fetchUsername() async {
        if let userId = log.userId {
            if let profile = try? await FriendsService.shared.findUserById(userId: userId) {
                username = profile.username
            }
        }
    }
}

struct IncomingRequestRow: View {
    @EnvironmentObject var viewModel: AppViewModel
    let request: FriendWithProfile
    @State private var showBlockConfirmation = false

    var body: some View {
        HStack(spacing: 15) {
            // Avatar
            Circle()
                .fill(Color.poopLightBrown.opacity(0.2))
                .frame(width: 45, height: 45)
                .overlay(
                    Text((request.profile.username ?? "?").prefix(1).uppercased())
                        .font(.headline)
                        .foregroundColor(.poopBrown)
                )

            // Username
            Text(request.profile.username ?? "Unknown")
                .font(.headline)

            Spacer()

            // Action buttons
            HStack(spacing: 8) {
                Button(action: {
                    Task {
                        await viewModel.acceptFriendRequest(friendshipId: request.friendship.id)
                    }
                }) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title2)
                }
                .buttonStyle(.borderless)

                Button(action: {
                    Task {
                        await viewModel.declineFriendRequest(friendshipId: request.friendship.id)
                    }
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.orange)
                        .font(.title2)
                }
                .buttonStyle(.borderless)

                Button(action: {
                    showBlockConfirmation = true
                }) {
                    Image(systemName: "hand.raised.circle.fill")
                        .foregroundColor(.red)
                        .font(.title2)
                }
                .buttonStyle(.borderless)
            }
        }
        .padding(.vertical, 4)
        .alert("Block User", isPresented: $showBlockConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Block", role: .destructive) {
                Task {
                    await viewModel.blockUser(friendshipId: request.friendship.id)
                }
            }
        } message: {
            Text("Are you sure you want to block this user?")
        }
    }
}

struct SentRequestRow: View {
    @EnvironmentObject var viewModel: AppViewModel
    let request: FriendWithProfile

    var body: some View {
        HStack(spacing: 15) {
            // Avatar
            Circle()
                .fill(Color.poopLightBrown.opacity(0.2))
                .frame(width: 45, height: 45)
                .overlay(
                    Text((request.profile.username ?? "?").prefix(1).uppercased())
                        .font(.headline)
                        .foregroundColor(.poopBrown)
                )

            // Username
            VStack(alignment: .leading, spacing: 2) {
                Text(request.profile.username ?? "Unknown")
                    .font(.headline)
                Text("Pending...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Cancel button
            Button(action: {
                Task {
                    await viewModel.cancelSentRequest(friendshipId: request.friendship.id)
                }
            }) {
                Text("Cancel")
                    .font(.subheadline)
                    .foregroundColor(.red)
            }
            .buttonStyle(.borderless)
        }
        .padding(.vertical, 4)
    }
}
