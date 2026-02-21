
import Foundation
import Supabase
import Combine

@MainActor
class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var session: Session?
    @Published var profile: Profile?
    
    private let client = SupabaseManager.shared.client
    
    private init() {
        Task {
            try? await restoreSession()
        }
    }
    
    func restoreSession() async throws {
        self.session = try? await client.auth.session
        if let user = session?.user {
            await fetchProfile(userId: user.id)
        }
    }
    
    func signUp(email: String, password: String, username: String) async throws {
        let response = try await client.auth.signUp(email: email, password: password)
        
        if let session = response.session {
            self.session = session
            // Create profile
            let update = Profile(id: session.user.id.uuidString, username: username)
            try await client.from("profiles").upsert(update).execute()
            
            await fetchProfile(userId: session.user.id)
        } else {
            // Fallback if session is not immediately available (e.g. email confirmation)
            // But we still create the profile if user exists
             if let userId = client.auth.currentUser?.id {
                 let update = Profile(id: userId.uuidString, username: username)
                 try await client.from("profiles").upsert(update).execute()
            }
        }
    }
    
    func signIn(email: String, password: String) async throws {
        let _ = try await client.auth.signIn(email: email, password: password)
        self.session = try? await client.auth.session
        if let userId = session?.user.id {
            await fetchProfile(userId: userId)
        }
    }
    
    func signOut() async throws {
        try await client.auth.signOut()
        self.session = nil
        self.profile = nil
    }
    
    func deleteAccount() async throws {
        guard let userId = session?.user.id else { return }
        
        // Delete user data (Cascading deletes usually handle logs if configured, but let's be explicit if needed or just delete profile)
        // If Supabase RLS allows, we can delete from 'profiles'
        try await client.from("profiles").delete().eq("id", value: userId).execute()
        
        // Then sign out
        try await signOut()
    }
    
    func fetchProfile(userId: UUID) async {
        do {
            let profile: Profile = try await client
                .from("profiles")
                .select()
                .eq("id", value: userId)
                .single()
                .execute()
                .value
            
            self.profile = profile
        } catch {
            print("Error fetching profile: \(error)")
        }
    }
}
