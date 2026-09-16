import SwiftUI

struct IncidentListView: View {
    @StateObject private var store = IncidentStore()
    @State private var showingAdd = false

    var body: some View {
        NavigationStack {
            Group {
                if store.incidents.isEmpty {
                    ContentUnavailableView(
                        "اینسیدنتی ثبت نشده",
                        systemImage: "list.bullet.rectangle",
                        description: Text("برای شروع، روی + بزنید و یک اینسیدنت ثبت کنید.")
                    )
                } else {
                    ScrollView(.horizontal, showsIndicators: true) {
                        VStack(spacing: 0) {
                            HeaderRow()

                            ScrollView(.vertical, showsIndicators: true) {
                                LazyVStack(spacing: 0) {
                                    ForEach(store.incidents) { incident in
                                        IncidentRow(incident: incident)
                                        Divider()
                                    }
                                }
                            }
                        }
                        .frame(minWidth: 1180)
                    }
                }
            }
            .navigationTitle("مدیریت اینسیدنت‌ها")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("ثبت اینسیدنت")
                }
            }
            .sheet(isPresented: $showingAdd) {
                AddIncidentView { incident in
                    store.add(incident)
                }
            }
            .environment(\.layoutDirection, .rightToLeft)
        }
    }
}

struct HeaderRow: View {
    var body: some View {
        HStack(spacing: 0) {
            Cell("شماره اینسیدنت", width: 150, bold: true)
            Cell("موضوع اینسیدنت", width: 260, bold: true)
            Cell("تاریخ ثبت", width: 150, bold: true)
            Cell("پیمانکار", width: 160, bold: true)
            Cell("تاریخ پیگیری ۱", width: 150, bold: true)
            Cell("تاریخ پیگیری ۲", width: 150, bold: true)
            Cell("درصد پیشرفت", width: 140, bold: true)
            Cell("زمان سپری‌شده", width: 210, bold: true)
        }
        .background(Color(.secondarySystemBackground))
    }
}

struct IncidentRow: View {
    let incident: Incident
    @State private var now = Date()

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 0) {
            Cell(incident.number, width: 150)
            Cell(incident.subject, width: 260)
            Cell(dateText(incident.registeredAt), width: 150)
            Cell(incident.contractor, width: 160)
            Cell(dateText(incident.followUp1), width: 150)
            Cell(dateText(incident.followUp2), width: 150)

            VStack {
                ProgressView(value: incident.progress, total: 100)
                Text("\(Int(incident.progress))٪")
                    .font(.caption)
            }
            .frame(width: 140, height: 55)
            .padding(.horizontal, 8)

            Text(elapsed(from: incident.registeredAt, to: now))
                .font(.system(.body, design: .monospaced))
                .frame(width: 210)
                .padding(.vertical, 16)
                .foregroundStyle(.primary)
        }
        .onReceive(timer) { value in
            now = value
        }
    }

    private func dateText(_ date: Date?) -> String {
        guard let date else { return "—" }
        return date.formatted(date: .numeric, time: .shortened)
    }

    private func elapsed(from start: Date, to end: Date) -> String {
        let seconds = max(0, Int(end.timeIntervalSince(start)))
        let days = seconds / 86400
        let hours = (seconds % 86400) / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        return String(format: "%02dروز %02d:%02d:%02d", days, hours, minutes, secs)
    }
}

struct Cell: View {
    let text: String
    let width: CGFloat
    let bold: Bool

    init(_ text: String, width: CGFloat, bold: Bool = false) {
        self.text = text
        self.width = width
        self.bold = bold
    }

    var body: some View {
        Text(text)
            .font(bold ? .headline : .body)
            .frame(width: width, minHeight: 55)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 6)
            .overlay(Rectangle().stroke(Color.gray.opacity(0.25), lineWidth: 0.5))
    }
}
