
import Foundation
import Supabase

class StorageService {
    static let shared = StorageService()
    private let client = SupabaseManager.shared.client
    
    func fetchLogs() async throws -> [PoopLog] {
        if AuthService.shared.session != nil {
            let logs: [PoopLog] = try await client
                .from("poop_logs")
                .select()
                .order("created_at", ascending: false)
                .execute()
                .value
            return logs
        } else {
            return try fetchLocalLogs()
        }
    }
    
    @MainActor
    func saveLog(_ log: PoopLog) async throws {
        if let user = AuthService.shared.session?.user {
            var newLog = log
            newLog.userId = user.id.uuidString
            
            try await client
                .from("poop_logs")
                .insert(newLog)
                .execute()
        } else {
            try saveLocalLog(log)
        }
    }
    
    @MainActor
    func updateLog(_ log: PoopLog) async throws {
        guard let logId = log.id else {
            throw StorageError.missingId
        }

        if AuthService.shared.session != nil {
            try await client
                .from("poop_logs")
                .update(log)
                .eq("id", value: logId)
                .execute()
        } else {
            try saveLocalLog(log) // Local helper already handles updates
        }
    }

    func deleteLog(id: String) async throws {
        if AuthService.shared.session != nil {
            try await client
                .from("poop_logs")
                .delete()
                .eq("id", value: id)
                .execute()
        } else {
            try deleteLocalLog(id: id)
        }
    }
    
    // MARK: - Local Storage Helpers
    
    private var localFileURL: URL {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documents.appendingPathComponent("poop_logs.json")
    }
    
    private func fetchLocalLogs() throws -> [PoopLog] {
        guard FileManager.default.fileExists(atPath: localFileURL.path) else { return [] }
        let data = try Data(contentsOf: localFileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let logs = try decoder.decode([PoopLog].self, from: data)
        return logs.sorted { ($0.timestamp ?? Date()) > ($1.timestamp ?? Date()) }
    }
    
    private func saveLocalLog(_ log: PoopLog) throws {
        var logs = try fetchLocalLogs()
        var newLog = log
        if newLog.id == nil { newLog.id = UUID().uuidString }
        if newLog.timestamp == nil { newLog.timestamp = Date() }
        
        // Update if exists, else append
        if let index = logs.firstIndex(where: { $0.id == newLog.id }) {
            logs[index] = newLog
        } else {
            logs.append(newLog)
        }
        
        try persistLogs(logs)
    }
    
    private func deleteLocalLog(id: String) throws {
        var logs = try fetchLocalLogs()
        logs.removeAll { $0.id == id }
        try persistLogs(logs)
    }
    
    private func persistLogs(_ logs: [PoopLog]) throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(logs)
        try data.write(to: localFileURL)
    }
}

// MARK: - Errors

enum StorageError: LocalizedError {
    case missingId

    var errorDescription: String? {
        switch self {
        case .missingId:
            return "Cannot update log without an ID"
        }
    }
}
