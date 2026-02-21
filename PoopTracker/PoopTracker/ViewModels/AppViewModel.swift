
import SwiftUI
import Combine

@MainActor
class AppViewModel: ObservableObject {
    @Published var currentUser: Profile?
    @Published var logs: [PoopLog] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isGuest = false

    // Friends-related state
    @Published var friends: [FriendWithProfile] = []
    @Published var pendingRequests: [FriendWithProfile] = []
    @Published var sentRequests: [FriendWithProfile] = []
    @Published var friendLogs: [PoopLog] = []

    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Bind Auth Profile to ViewModel
        AuthService.shared.$profile
            .receive(on: RunLoop.main)
            .assign(to: \.currentUser, on: self)
            .store(in: &cancellables)
            
        setupGuestObserver()

            
        Task {
            try? await AuthService.shared.restoreSession()
            if AuthService.shared.session != nil {
                await fetchLogs()
            }
        }
    }
    
    // Watch for guest mode changes
    private func setupGuestObserver() {
        $isGuest
            .filter { $0 }
            .sink { [weak self] _ in
                Task {
                    await self?.fetchLogs()
                }
            }
            .store(in: &cancellables)
    }
    
    func fetchLogs() async {
        isLoading = true
        do {
            self.logs = try await StorageService.shared.fetchLogs()
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }
    
    func addLog(_ log: PoopLog) async {
        let xp = GamificationService.calculateXP(log: log)
        var finalLog = log
        finalLog.xpGained = xp
        
        do {
            try await StorageService.shared.saveLog(finalLog)
            await fetchLogs() // Refresh list
        } catch {
            self.errorMessage = "Failed to save log: \(error.localizedDescription)"
        }
    }
    
    func deleteLog(id: String) async {
        do {
            try await StorageService.shared.deleteLog(id: id)
            await fetchLogs()
        } catch {
             self.errorMessage = "Failed to delete: \(error.localizedDescription)"
        }
    }
    
    func logout() async {
        do {
            try await AuthService.shared.signOut()
            self.currentUser = nil
            self.logs = []
        } catch {
            self.errorMessage = "Failed to sign out: \(error.localizedDescription)"
        }
    }
    
    func deleteAccount() async {
        do {
            try await AuthService.shared.deleteAccount()
            self.currentUser = nil
            self.logs = []
        } catch {
            self.errorMessage = "Failed to delete account: \(error.localizedDescription)"
        }
    }

    // MARK: - Friends Methods

    func fetchFriends() async {
        isLoading = true
        do {
            self.friends = try await FriendsService.shared.fetchFriends()
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func fetchPendingRequests() async {
        do {
            self.pendingRequests = try await FriendsService.shared.fetchPendingRequests()
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }

    func fetchSentRequests() async {
        do {
            self.sentRequests = try await FriendsService.shared.fetchSentRequests()
        } catch {
            self.errorMessage = error.localizedDescription
        }
    }

    func fetchFriendLogs() async {
        isLoading = true
        do {
            self.friendLogs = try await FriendsService.shared.fetchFriendLogs()
        } catch {
            self.errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func sendFriendRequest(toUserId: String) async {
        do {
            try await FriendsService.shared.sendFriendRequest(toUserId: toUserId)
            await fetchSentRequests()
        } catch {
            self.errorMessage = "Failed to send request: \(error.localizedDescription)"
        }
    }

    func acceptFriendRequest(friendshipId: String) async {
        do {
            try await FriendsService.shared.acceptFriendRequest(friendshipId: friendshipId)
            await fetchPendingRequests()
            await fetchFriends()
            await fetchFriendLogs()
        } catch {
            self.errorMessage = "Failed to accept request: \(error.localizedDescription)"
        }
    }

    func declineFriendRequest(friendshipId: String) async {
        do {
            try await FriendsService.shared.declineFriendRequest(friendshipId: friendshipId)
            await fetchPendingRequests()
        } catch {
            self.errorMessage = "Failed to decline request: \(error.localizedDescription)"
        }
    }

    func blockUser(friendshipId: String) async {
        do {
            try await FriendsService.shared.blockUser(friendshipId: friendshipId)
            await fetchPendingRequests()
        } catch {
            self.errorMessage = "Failed to block user: \(error.localizedDescription)"
        }
    }

    func removeFriend(friendshipId: String) async {
        do {
            try await FriendsService.shared.removeFriend(friendshipId: friendshipId)
            await fetchFriends()
            await fetchFriendLogs()
        } catch {
            self.errorMessage = "Failed to remove friend: \(error.localizedDescription)"
        }
    }

    func cancelSentRequest(friendshipId: String) async {
        do {
            try await FriendsService.shared.declineFriendRequest(friendshipId: friendshipId)
            await fetchSentRequests()
        } catch {
            self.errorMessage = "Failed to cancel request: \(error.localizedDescription)"
        }
    }
}
