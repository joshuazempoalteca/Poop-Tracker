
import SwiftUI

struct AuthView: View {
    @EnvironmentObject var viewModel: AppViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var isAnimating = false
    @State private var isSignUp = false
    @State private var error: String?
    
    var body: some View {
        ZStack {
            AppTheme.gradient.ignoresSafeArea().opacity(0.1)
            
            VStack(spacing: 20) {
                Spacer()
                Text("💩").font(.system(size: 80))
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                if let error = error {
                    Text(error).foregroundColor(.red).font(.caption)
                }
                
                if isSignUp {
                    // Sign Up Mode
                    Button("Sign Up") {
                        Task {
                            do {
                                // Generate unique username: email prefix + random 4 digits
                                let prefix = email.components(separatedBy: "@").first ?? "User"
                                let randomSuffix = Int.random(in: 1000...9999)
                                let uniqueUsername = "\(prefix)\(randomSuffix)"
                                
                                try await AuthService.shared.signUp(email: email, password: password, username: uniqueUsername)
                            } catch {
                                handleError(error)
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.poopBrown)
                    
                    Button("Already have an account? Sign In") {
                        withAnimation { isSignUp = false }
                    }
                    .padding(.top, 10)
                    
                } else {
                    // Sign In Mode
                    Button("Sign In") {
                        Task {
                            do {
                                try await AuthService.shared.signIn(email: email, password: password)
                            } catch {
                                handleError(error)
                            }
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color.poopBrown)
                    
                    Button("Create Account") {
                        withAnimation { isSignUp = true }
                    }
                    .padding(.top, 10)
                }
                
                Button("Continue as Guest") {
                    viewModel.isGuest = true
                }
                .foregroundColor(.secondary)
                .padding(.top, 10)
                
                Spacer()
            }
            .padding(30)
        }
    }
    
    private func handleError(_ error: Error) {
        let message = error.localizedDescription
        if message.contains("User already registered") {
             self.error = "Account exists! Please just Sign In."
        } else {
             self.error = message
        }
    }
}
