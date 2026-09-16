import SwiftUI

struct AddIncidentView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var number = ""
    @State private var subject = ""
    @State private var contractor = ""
    @State private var registeredAt = Date()
    @State private var followUp1Enabled = false
    @State private var followUp1 = Date()
    @State private var followUp2Enabled = false
    @State private var followUp2 = Date()
    @State private var progress = 0.0

    let onSave: (Incident) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("اطلاعات اینسیدنت") {
                    TextField("شماره اینسیدنت", text: $number)
                    TextField("موضوع اینسیدنت", text: $subject, axis: .vertical)
                    TextField("پیمانکار", text: $contractor)
                    DatePicker("تاریخ ثبت", selection: $registeredAt)
                }

                Section("پیگیری‌ها") {
                    Toggle("پیگیری ۱", isOn: $followUp1Enabled)
                    if followUp1Enabled {
                        DatePicker("تاریخ پیگیری ۱", selection: $followUp1)
                    }

                    Toggle("پیگیری ۲", isOn: $followUp2Enabled)
                    if followUp2Enabled {
                        DatePicker("تاریخ پیگیری ۲", selection: $followUp2)
                    }
                }

                Section("پیشرفت") {
                    HStack {
                        Slider(value: $progress, in: 0...100, step: 1)
                        Text("\(Int(progress))٪")
                            .frame(width: 55)
                    }
                }
            }
            .navigationTitle("ثبت اینسیدنت")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("لغو") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("ثبت") {
                        let incident = Incident(
                            number: number.isEmpty ? "بدون شماره" : number,
                            subject: subject.isEmpty ? "بدون موضوع" : subject,
                            registeredAt: registeredAt,
                            contractor: contractor.isEmpty ? "—" : contractor,
                            followUp1: followUp1Enabled ? followUp1 : nil,
                            followUp2: followUp2Enabled ? followUp2 : nil,
                            progress: progress
                        )
                        onSave(incident)
                        dismiss()
                    }
                }
            }
            .environment(\.layoutDirection, .rightToLeft)
        }
    }
}
