function createInitialE2EState() {
  const now = new Date().toISOString();

  return {
    authToken: "e2e-token-123",
    user: {
      _id: "user-e2e-1",
      id: "user-e2e-1",
      name: "Patient Zero",
      email: "patient@medivault.test",
      role: "patient",
      createdAt: now,
      updatedAt: now,
    },
    doctors: [
      {
        _id: "doctor-e2e-1",
        name: "Alice Heart",
        email: "alice.heart@medivault.test",
        role: "doctor",
      }
    ],
    records: [
      {
        _id: "record-e2e-1",
        user: { name: "Patient Zero" },
        originalName: "baseline-report.pdf",
        fileUrl: "https://example.test/files/baseline-report.pdf",
        size: 2048,
        createdAt: now,
      }
    ],
    documents: [],
    emergency: {
      emergencyAccessEnabled: false,
      emergencyToken: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      publicUrl: "http://localhost:3001/api/public/emergency/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      emergencyProfile: {
        fullName: "Patient Zero",
        age: 34,
        bloodGroup: "O+",
        allergies: ["Penicillin"],
        conditions: ["Asthma"],
        medications: ["Inhaler"],
        emergencyContacts: [
          {
            name: "Sam Zero",
            relation: "Sibling",
            phone: "+1-555-0199"
          }
        ],
        notes: "Carries rescue inhaler",
      },
      updatedAt: now,
    }
  };
}

module.exports = {
  createInitialE2EState,
};
