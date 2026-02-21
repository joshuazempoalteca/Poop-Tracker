
import SwiftUI
import Combine

@MainActor
class AppViewModel: ObservableObject {
    @Published var currentUser: Profile?
    @Published var logs: [PoopLog] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isGuest = false
    
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
}
