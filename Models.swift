import Foundation

struct Incident: Identifiable, Codable {
    var id = UUID()
    var number: String
    var subject: String
    var registeredAt: Date
    var contractor: String
    var followUp1: Date?
    var followUp2: Date?
    var progress: Double
}

final class IncidentStore: ObservableObject {
    @Published var incidents: [Incident] = [] {
        didSet { save() }
    }

    private let key = "incident_tracker_data"

    init() { load() }

    func add(_ incident: Incident) {
        incidents.insert(incident, at: 0)
    }

    func delete(at offsets: IndexSet) {
        incidents.remove(atOffsets: offsets)
    }

    private func save() {
        if let data = try? JSONEncoder().encode(incidents) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: key),
           let value = try? JSONDecoder().decode([Incident].self, from: data) {
            incidents = value
        }
    }
}
